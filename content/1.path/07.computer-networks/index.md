---
title: Computer networks
description: "One machine you understand. Every real system is several, and the wire between them is where the interesting failures live: addresses, ports, handshakes, status codes and certificates."
code: JSG-07
duration: 2 weeks
stage: cs
icon: i-lucide-network
outcomes:
  - You can name the seven OSI layers and the four TCP/IP layers, and say what each one is for
  - You can tell a hub, a switch and a router apart, and a MAC address from an IP address
  - You can subnet a /26 by hand and give the network address, broadcast and usable hosts
  - You can explain TCP against UDP, the three-way handshake, and how DNS resolves a name
  - You can pick the right HTTP method and status code, and explain cookies, sessions and HTTPS
  - You can answer "what happens when you type a URL and press Enter" end to end
prerequisites:
  - operating-systems
---

You understand one machine now: its processes, its memory, its files. Count the
machines involved in anything you have ever used, though, and the number is
never one. The wire between them is a subject of its own.

## Why this track exists

Computer networks is one of the four computer science subjects every fresher is
assumed to know, alongside DBMS, OOPs and operating systems. In the walk-ins I
sat in Bangalore in 2018 it came up in two forms. The written round had a
handful of multiple-choice questions (which layer does a router work at, which
port is HTTPS, how many hosts in a /27). The technical round had the question so
standard it has a name: "what happens when you type a URL and press Enter".

Most of networking is not your job. You are not going to build a router. What
you need is the chain (address, port, connection, request, reply) in enough
detail to answer those questions without hedging, and to read an error at work
and know which link broke. That is two weeks, not a semester.

## How the track is arranged

::steps
### The layers
Why the network is layered, the OSI and TCP/IP models, and the devices at each
layer.

### Addressing
MAC and IP, ARP, subnetting, IPv6, NAT, DHCP, ports and DNS.

### Transport
TCP against UDP, then the handshake.

### The web
HTTP methods, status codes, cookies and sessions, HTTPS.

### Putting it together
Timeouts and retries, then the URL question end to end.

### Revision
The glossary, an interview bank of more than twenty questions, and exercises.
::

::callout{icon="i-lucide-arrow-right"}
It starts with the problem that does not exist inside one computer: the thing in
between two of them is unreliable, and it does not care about you.
::
