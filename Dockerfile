ARG DENO_VERSION=1.30.2

FROM denoland/deno:bin-$DENO_VERSION AS deno
FROM nginx:1.23.3
COPY --from=deno /deno /usr/local/bin/deno

RUN mkdir -p /etc/nginx/container.conf.d/stream
RUN mkdir -p /etc/nginx/container.conf.d/map
ADD ./nginx.conf /etc/nginx/nginx.conf

ADD ./start.sh /start.sh
RUN chmod +x /start.sh

RUN mkdir /app/
ADD ./mapper /app/mapper
RUN deno cache /app/mapper/main.ts

ENTRYPOINT ["/start.sh"]

