FROM denoland/deno:alpine-1.19.1

EXPOSE 8000

RUN mkdir /app

WORKDIR /app

RUN deno install -qAf --unstable https://deno.land/x/denon/denon.ts

COPY . .

RUN deno cache src/index.ts

ENTRYPOINT ["denon", "start"]
