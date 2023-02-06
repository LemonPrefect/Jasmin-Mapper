export function normalize(obj: Record<string, unknown>){
    const json = JSON.stringify(obj);
    return JSON.parse(json.replace(new RegExp(" "), ""));
}