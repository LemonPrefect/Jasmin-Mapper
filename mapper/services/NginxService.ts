import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import { IMap } from "../interfaces/IMap.ts";

export class NginxService{
  public static reload(){
    const result = Deno.run({
      cmd: ["nginx", "-s", "reload"],
      stdout: "piped",
      stderr: "piped",
    });
    result.status().then(e => {
      if(!e.success){
        result.stderrOutput().then(e => {
          throw new Error(new TextDecoder().decode(e));
        })
      }
    })
  }

  public static resume(): Array<IMap>{
    const result: Array<IMap> = [] as Array<IMap>;
    const upstreams: Array<string> = fs.readdirSync("/etc/nginx/container.conf.d/stream/");
    for(const upstream of upstreams){
      const data = fs.readFileSync(upstream).toString().split("\n");
      const map: IMap = {
        prefix: upstream.split(".")[0]
      } as IMap;
      for(const datum of data){
        const exploded = datum.split(" ");
        const [ ip, port ] = exploded[4]!.replace(";", "").split(":");
        map.containers.push({
          ip: ip.trim(), 
          port: parseInt(port), 
          alias: exploded[1].trim()
        })
      }
      result.push(map);
    }
    return result;
  }

  public static map(map: IMap, suffix: string): void{
    if (
      fs.existsSync(`/etc/nginx/container.conf.d/stream/${map.prefix}.conf`) ||
      fs.existsSync(`/etc/nginx/container.conf.d/map/${map.prefix}.conf`)
    ) {
      throw new Error(`File ${map.prefix}.conf exists.`);
    }
  
    let maps = "";
    let streams = "";

    for (const container of map.containers) {
      if(!container.alias.startsWith(map.prefix)) {
        throw Error(`Container alias must starts with map prefix ${map.prefix}.`);
      }
      streams += `upstream ${container.alias} { server ${container.ip}:${container.port}; }\n`;
      maps += `${container.alias}.${suffix} ${container.alias};\n`;
    }

    fs.writeFileSync(
    `/etc/nginx/container.conf.d/stream/${map.prefix}.conf`,
    streams,
    );
    fs.writeFileSync(
      `/etc/nginx/container.conf.d/map/${map.prefix}.conf`,
      maps,
    );
  }

  public static remove(prefix: string): void{
    if (
      fs.existsSync(`/etc/nginx/container.conf.d/stream/${prefix}.conf`) ||
      fs.existsSync(`/etc/nginx/container.conf.d/map/${prefix}.conf`)
    ) {
      fs.rmSync(`/etc/nginx/container.conf.d/stream/${prefix}.conf`);
      fs.rmSync(`/etc/nginx/container.conf.d/map/${prefix}.conf`);  
    }
  }
}
