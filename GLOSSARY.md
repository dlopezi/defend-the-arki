# Defend the Arki

A tower defense game about system architecture, played in the browser and shared with friends and colleagues.

## Language

**Level**:
A stage of the game named after a system architecture (Monolith, Microservices, Kubernetes, Multi-region). The architecture decides what happens when a threat breaks through a lane. Every level is open from the start.
_Avoid_: Mode, stage

**Lane**:
One of the five rows of the board that threats travel along. What a lane stands for depends on the level: a service in Microservices, a pod in Kubernetes, part of a region in Multi-region.
_Avoid_: Row, track

**Breach**:
A threat reaching the left end of a lane. What a breach takes down depends on the level.
_Avoid_: Cross, leak

**Rollback**:
A one-time sweep that clears a lane when a threat reaches its start. Every level except Monolith gives one per lane; it is lost for good when its lane goes down.

**Region**:
In the Multi-region level, a group of lanes that takes traffic, goes down, and comes back (without defenses) as one unit. Lanes 1–3 form the larger region, eu-west; lanes 4–5 form the smaller one, us-east. Both regions take traffic from the start.
_Avoid_: Zone, cluster, primary/secondary

**Failover**:
While a region is down, new threats arrive only in the lanes of the other region.

**Provider failure**:
A failure the game causes by itself at a set moment, with no threat involved, as when a cloud provider goes down. It takes down what a Breach would take down in that level (a service, a pod, a region), so the Player always sees how the architecture reacts. It follows the same rules as a Breach, but it never takes down the last service, pod or region still up: only a threat can make the Player lose. Every Level except Monolith has one.
_Avoid_: Outage, incident, chaos test

## Feedback and releases

**Feedback**:
A free-text message a Player sends from inside the game, with technical context attached. It covers bugs, ideas and anything else.
_Avoid_: Bug report, comment, review

**Version**:
The number of a published build of the game (for example `1.0.0`), shown in the game and attached to every Feedback.
_Avoid_: Build number, release number

**Release**:
A Version made public to Players, marked with a git tag and release notes.
_Avoid_: Launch, drop
