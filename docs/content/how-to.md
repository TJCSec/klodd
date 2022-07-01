# How To Use Klodd

This is a guide for how to start, access, and stop challenges deployed using Klodd.

## Starting an Instance

When you first open the page for a challenge, you will see something like this:

![Screenshot showing the fruit-store challenge in a Stopped state](./img/fruit-store-stopped-light.png#only-light)
![Screenshot showing the fruit-store challenge in a Stopped state](./img/fruit-store-stopped-dark.png#only-dark)

To start an instance, simply click the "Start" button. The instance may remain in the "Starting" state for some time, after which it will transition to the "Running" state. At this point, the challenge instance is ready to be used.

## Accessing an Instance

A server address will be provided when an instance is in either the "Starting" or "Running" states.

### Web Challenges

If the challenge is accessible through a website, then no special action is needed. Either click the provided link or copy it into your solution script.

![Screenshot showing the fruit-store challenge in a Running state](./img/fruit-store-running-light.png#only-light)
![Screenshot showing the fruit-store challenge in a Running state](./img/fruit-store-running-dark.png#only-dark)

### TCP Challenges

If the challenge is accessible through a network socket, then you must connect, **using SNI**, to the host and port provided.

!!! warning "No netcat!"
    OpenBSD netcat (the `nc` command you probably have installed) does not support SNI, so you can **not** use a regular `nc` command to connect to TCP challenges deployed using Klodd.

![Screenshot showing the babyheapng challenge in a Running state](./img/babyheapng-running-light.png#only-light)
![Screenshot showing the babyheapng challenge in a Running state](./img/babyheapng-running-dark.png#only-dark)

Click one of the four tabs depending on which connection method you would like to use. This gives you a code snippet or command you can use to connect to the challenge. You can also click the copy button to the right to copy it to your clipboard.

Each of the four connection methods is explained in more detail below.

???+ example "Connecting with pwntools"
    [pwntools](https://github.com/Gallopsled/pwntools) supports SNI out of the box. This is the recommended connection method.
    ```python linenums="1" hl_lines="3"
    from pwn import remote

    r = remote('babyheapng-e20d62127bb9434b.tjc.tf', 1337, ssl=True)
    ```
    Apart from the `#!python ssl=True` in line 3, this is identical to connecting to a normal TCP challenge.

??? example "Connecting with socat"
    [socat](http://www.dest-unreach.org/socat/) only supports SNI in version 1.7.4.0 or later. Depending on your system, the version of socat installed may be too old. If this is the case, you can download and compile socat from source (this should only take a few minutes) or try a different connection method.

    The command copied from Klodd connects `STDIO` (`-` is shorthand) to the server. You can replace `-` with any address that socat supports; click "Proxy" below for an example.
    === "Direct"
        ```
        socat - openssl:babyheapng-e20d62127bb9434b.tjc.tf:1337
        ```
        This command connects directly to the server.
    === "Proxy"
        ```
        socat tcp-listen:12345,fork,reuseaddr openssl:babyheapng-e20d62127bb9434b.tjc.tf:1337
        ```
        This command starts a proxy listening on local port 12345 that forwards connections to the real server. This is just a normal socket server, and you can connect to it like you do in most CTFs:

        - `#!python remote('localhost', 12345)`
        - `nc localhost 12345`

??? example "Connecting with Ncat"
    [Ncat](https://nmap.org/ncat/) is an improved reimplementation of netcat from Nmap.
    ```
    ncat --ssl babyheapng-e20d62127bb9434b.tjc.tf 1337
    ```
    Apart from the `--ssl` option, this syntax is quite similar to regular netcat.

??? example "Connecting with OpenSSL `s_client`"
    [`s_client`](https://www.openssl.org/docs/man1.0.2/man1/openssl-s_client.html) is a generic SSL/TLS client from the OpenSSL command line tool.
    ```
    openssl s_client -quiet -verify_quiet -connect babyheapng-e20d62127bb9434b.tjc.tf:1337
    ```
    You may omit the `-quiet` and `-verify_quiet` options, but there will be some extra output from OpenSSL.

## Stopping an Instance

Each instance has a configured time limit, after which it will be stopped automatically. If you are finished with your instance before this happens, then you can click the "Stop" button to stop your instance early.
