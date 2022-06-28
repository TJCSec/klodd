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

![Screenshot showing the vacation-1 challenge in a Running state](./img/vacation-1-running-light.png#only-light)
![Screenshot showing the vacation-1 challenge in a Running state](./img/vacation-1-running-dark.png#only-dark)

!!! warning "No netcat!"
    OpenBSD netcat (the `nc` command you probably have installed) does not support SNI, so you can **not** use a regular `nc` command to connect to TCP challenges deployed using Klodd.

If you are using [pwntools](https://github.com/Gallopsled/pwntools), then simply add `ssl=True` to your `remote` call. This should work on most platforms.

!!! example "Connecting with pwntools"
    ```python linenums="1" hl_lines="3"
    from pwn import remote

    r = remote('vacation-1-02a372588ca930c0.tjc.tf', 1337, ssl=True)
    ```
    Note the `#!python ssl=True` in line 3.

Otherwise, you may use any of these:

- [socat](http://www.dest-unreach.org/socat/) (must use version 1.7.4.0 or later)
- [Ncat](https://nmap.org/ncat/) from Nmap
- [OpenSSL `s_client`](https://www.openssl.org/docs/man1.0.2/man1/openssl-s_client.html)

???+ example "Connecting with socat"
    === "Direct"
        ```
        socat - openssl:vacation-1-02a372588ca930c0.tjc.tf:1337
        ```
        This is the recommended connection method if not using pwntools.
    === "Proxy"
        ```
        socat tcp-listen:12345,fork,reuseaddr openssl:vacation-1-02a372588ca930c0.tjc.tf:1337
        ```
        This command starts a proxy listening on local port 12345 that forwards connections to the real server. This is just a normal socket server, and you can connect to it like you do in most CTFs:

        - `#!python remote('localhost', 12345)`
        - `nc localhost 12345`

??? example "Connecting with Ncat"
    ```
    ncat --ssl vacation-1-02a372588ca930c0.tjc.tf 1337
    ```
    Be careful when copy pasting the server address, as there is no colon (`:`) between the host and port in this command.

??? example "Connecting with OpenSSL `s_client`"
    ```
    openssl s_client -quiet -verify_quiet -connect vacation-1-02a372588ca930c0.tjc.tf:1337
    ```
    You may omit the `-quiet` and `-verify_quiet` options, but there will be some extra output from OpenSSL.

## Stopping an Instance

Each instance has a configured time limit, after which it will be stopped automatically. If you are finished with your instance before this happens, then you can click the "Stop" button to stop your instance early.
