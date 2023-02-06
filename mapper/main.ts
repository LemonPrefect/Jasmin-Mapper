// deno-lint-ignore-file no-unused-vars
import express, { Express, Next, Request, Response } from "npm:express@4.18.2";

import { NginxService } from "./services/NginxService.ts";
import { IMap } from "./interfaces/IMap.ts";
import { normalize } from "./utils.ts";

const ERROR_PAGE =
  '<!DOCTYPE html><html xmlns=http://www.w3.org/1999/xhtml><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"><title>Jasmin-Mapper 出错了</title><style>body{font:15px "Microsoft Yahei",Verdana;color:#333;background-color:#e7e8e9;margin:0}#c{border:1px solid #DCDDE2;background-color:#fff;padding:20% 40px 50px 40px}h1{margin:0;height:32px;font-size:18px;color:#1f1f1f;line-height:35px}p{margin:8px 1px}.x{background-color:#5f83a5e1;font-size:1px;height:2px;margin-bottom:8px}.x span{background-color:#002FA7;height:2px;border-right:#FFF solid 1px;display:block;width:100px}a{text-decoration:none;font-size:8px;color:#848484}</style><body><div id=c><h1 class=warning>Jasmin Mapper 由 Deno 强力驱动</h1><div class=x><span></span></div><p>你所访问的容器没有找到或容器映射丢失！</p></div><!--Copyright Ancient VBR -->';
const AUTHORIZATION = Deno.env.get("AUTHORIZATION") ?? Deno.exit(2);
const SUFFIX = Deno.env.get("DOMAIN_SUFFIX") ?? Deno.exit(3);

let maps: Array<IMap> = NginxService.resume();
export const app: Express = express();
app.use(express.json());

app.all("/\\w+", function (req: Request, res: Request, next: Next) {
  if (!req.get("authorization") || req.get("authorization") != AUTHORIZATION || req.hostname != `mapper.${SUFFIX}`) {
    return res.status(404).send(ERROR_PAGE);
  } else {
    res.setHeader("Content-Type", "application/json;charset=utf-8");
    next();
  }
});

app.all("*", function (req: Request, res: Request, next: Next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type, Authorization",
  );
  next();
});

app.post("/add", (req: Request, res: Response) => {
  const data = normalize(req.body) as IMap;
  if(!data || !data.prefix || !data.containers || data.containers.length === 0){
    return res.send(JSON.stringify({
      code: 1,
      msg: "Data structure is not sufficient."
    })); 
  }
  const map = maps.filter(map => map.prefix == data.prefix);
  if(map.length > 0){
    return res.send(JSON.stringify({
      code: 1,
      msg: `Duplicated ${data.prefix}.`
    }));
  }
  try{
    NginxService.map(data, SUFFIX);
    NginxService.reload();
    maps.push(data);
    return res.send(JSON.stringify({
      code: 0,
      msg: `Mapped ${data.prefix}.`
    }));  
  }catch(e){
    return res.send(JSON.stringify({
      code: 1,
      msg: (e as Error).message
    }));  
  }
});

app.post("/remove", (req: Request, res: Response) => {
  const data = normalize(req.body) as IMap;
  if(!data || !data.prefix){
    return res.send(JSON.stringify({
      code: 1,
      msg: "Data structure is not sufficient."
    }));  
  }
  try{
    NginxService.remove(data.prefix);
    NginxService.reload();
    maps = maps.filter(map => map.prefix != data.prefix);
    return res.send(JSON.stringify({
      code: 0,
      msg: `Removed ${data.prefix}.`
    }));  
  }catch(e){
    return res.send(JSON.stringify({
      code: 1,
      msg: (e as Error).message
    }));  
  }
});

app.post("/reload", (req: Request, res: Response) => {
  try{
    NginxService.reload();
    return res.send(JSON.stringify({
      code: 0,
      msg: `Nginx Reloaded.`
    }));  
  }catch(e){
    return res.send(JSON.stringify({
      code: 1,
      msg: (e as Error).message
    }));  
  }
});


app.get("/*", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  res.status(404).send(ERROR_PAGE);
});

app.post("/*", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  res.status(404).send(ERROR_PAGE);
});

app.listen(8787);







