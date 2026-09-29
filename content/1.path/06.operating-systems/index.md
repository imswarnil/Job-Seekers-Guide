---
title: Operating systems
description: The program that runs your programs. Processes and threads, CPU scheduling, synchronisation, deadlock, memory and file systems, learned from things you can watch happen and answered the way a fresher interview asks.
code: JSG-06
duration: 3 weeks
stage: cs
icon: i-lucide-cpu
outcomes:
  - You can say what an operating system actually does, with an example of each job, instead of reciting a definition
  - You can explain process versus thread, the five process states, the PCB and what a context switch costs
  - You can draw a Gantt chart for FCFS, SJF, SRTF, Round Robin and priority scheduling and compute waiting and turnaround time
  - You can explain a race condition, a critical section, a mutex, a semaphore and the producer-consumer problem
  - You can name the four deadlock conditions and run the banker's algorithm on a small example
  - You can translate an address through a page table and count page faults for FIFO, LRU and Optimal
  - You can read a permission error or an OutOfMemoryError and say which layer produced it
prerequisites:
  - oops
---

The OOPs track was about how you arrange the objects inside one program. This
track is about the thing that runs that program: the layer between your code and
the hardware that decides when it runs, how much memory it gets, and whether it
is allowed to open the file it asked for.

## Why this track exists, and why it is here

Operating systems is one of the four computer science subjects a fresher is
assumed to have (with DBMS, OOPs and computer networks), and it is asked about
directly. In the technical round of a service company it is usually two or three
questions: process versus thread, a scheduling algorithm, deadlock, paging. In
the written round of some companies it turns up as a Gantt chart to compute or a
page-fault count, which is free marks if you have practised the arithmetic once
and lost marks if you have not.

When I was sitting walk-ins from BTM Layout, I could recite "an operating system
is an interface between the user and the hardware" and nothing after it. The
first interviewer who asked "why is `i++` not thread-safe" ended that interview
in about a minute. This track is written so that does not happen to you: every
idea comes with something you can watch on your own machine or work out on
paper, because an answer built on something you have seen sounds completely
different from one you memorised.

## How the track is laid out

::steps
### The kernel
What an operating system actually does, the system call, and how a machine starts.

### Processes and threads
The process, its states and its PCB, threads, and the context switch.

### CPU scheduling
Five algorithms on the same four processes, with the arithmetic shown.

### Synchronisation and deadlock
Race conditions, mutexes, semaphores, producer-consumer, then the four deadlock
conditions and the banker's algorithm.

### Memory and files
Fragmentation, paging, segmentation, virtual memory, page replacement, thrashing,
OutOfMemoryError, then inodes, disk allocation and permissions.

### Revision
The glossary, an interview bank of thirty-two questions, and exercises.
::

::callout{icon="i-lucide-arrow-right"}
Start with the question nobody answers well: not what an operating system is,
but what it actually does all day.
::
