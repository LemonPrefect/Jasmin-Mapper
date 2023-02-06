#!/bin/bash
echo $CERTIFICATE | base64 -d > /app/cert.cer
echo $CERTIFICATE_KEY | base64 -d > /app/key.key

sed -i "s/DOMAIN_SUFFIX/$DOMAIN_SUFFIX/" /etc/nginx/nginx.conf

nohup deno run -A /app/mapper/main.ts 2>&1 > /app/mapper.log &
nginx -g "daemon off;"
