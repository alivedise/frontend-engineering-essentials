---
id: 419
title: "WebRTC — Peer-to-Peer Media and Data Channels"
state: draft
slug: webrtc
---

# [FEE-419] WebRTC — Peer-to-Peer Media and Data Channels

:::info
WebRTC (Web Real-Time Communication) lets browsers exchange audio, video, and arbitrary data directly with each other: no plugin, and in the best case no media server in the path. The API surface is small (`RTCPeerConnection`, `RTCDataChannel`, `getUserMedia`, `getDisplayMedia`), but the machinery underneath is not. Every connection is negotiated through an offer/answer exchange of SDP (Session Description Protocol) blobs over a signaling channel the application provides, punched through NATs by ICE (Interactive Connectivity Establishment) with help from STUN and TURN servers, and encrypted end to end with DTLS and SRTP, the datagram variants of TLS and secure RTP. WebRTC 1.0 has been a W3C Recommendation since January 2021, the standardized Encoded Transform API reached cross-browser Baseline in 2025, and the encrypted stack now defaults to DTLS 1.3 in Firefox (mid-2024) and Chrome (early 2025). The platform is mature; the hard parts today are negotiation correctness and deployment topology, not browser support.
:::

## Context

Before WebRTC, real-time media in the browser meant Flash or proprietary plugins, and "peer-to-peer" meant a desktop app. The project began at Google in 2011 with the open-sourcing of codec and echo-cancellation code, was standardized jointly by the W3C (the JavaScript API) and the IETF (the wire protocols), and reached W3C Recommendation status on 26 January 2021. Adoption ran far ahead of the formal milestones: video conferencing, live-stream ingestion, cloud gaming, and file-transfer tools all shipped on pre-1.0 WebRTC. Browser availability was never the hard part. WebRTC deliberately standardizes only what happens after two peers know about each other; signaling transport, session management, and multi-party topology are the application's problem. This article covers the connection machinery, the negotiation pattern that survives real-world race conditions, screen capture as a media source, and the topology decisions every production deployment faces. Companion transports are covered in [WebSockets & Server-Sent Events](/en/Browser APIs and Web Platform/409) and [WebTransport](/en/Browser APIs and Web Platform/411).

## Visual

```mermaid
sequenceDiagram
    participant A as Peer A (caller)
    participant S as Signaling server<br/>(app-provided, e.g. WebSocket)
    participant T as STUN/TURN servers<br/>(address discovery / relay)
    participant B as Peer B (callee)

    A->>A: getUserMedia() / addTrack()
    A->>A: createOffer() + setLocalDescription()
    A->>S: SDP offer
    S->>B: SDP offer
    B->>B: setRemoteDescription(offer)
    B->>B: addTrack(), setLocalDescription() (answer)
    B->>S: SDP answer
    S->>A: SDP answer
    A->>A: setRemoteDescription(answer)
    par Trickle ICE (both sides, concurrent)
        A->>T: STUN binding / TURN allocation
        T-->>A: srflx (server-reflexive) / relay candidates
        A->>S: icecandidate events
        S->>B: candidates
        B->>S: candidates
        S->>A: candidates
    end
    A->>B: ICE connectivity checks, DTLS handshake
    Note over A,B: SRTP media + SCTP data channels flow peer-to-peer<br/>(or via TURN relay when direct paths fail)
```

## Example

The recommended negotiation code is the **perfect negotiation** pattern from the WebRTC spec and MDN: both peers run identical logic, and a boolean `polite` flag assigned by the application (for example, "the peer that joined second is polite") resolves *glare*, the collision where both sides send an offer at once. The polite peer rolls back its own offer and accepts the incoming one; the impolite peer ignores the collision and wins. Two notes on the moving parts: `signaler` is your application's signaling wrapper (a thin WebSocket client, say), which WebRTC never sees, and the SDP descriptions it carries are text blobs you pass through unparsed, created by one browser and consumed by the other.

```js
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.example.net" },
    { urls: "turn:turn.example.net", username: "u", credential: "c" },
  ],
});

let makingOffer = false;
let ignoreOffer = false;
let isSettingRemoteAnswerPending = false;

pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true;
    // Argument-less setLocalDescription() creates the right description
    // for the current signalingState -- here, always an offer.
    await pc.setLocalDescription();
    signaler.send({ description: pc.localDescription });
  } finally {
    makingOffer = false;
  }
};

pc.onicecandidate = ({ candidate }) => signaler.send({ candidate });

signaler.onmessage = async ({ description, candidate }) => {
  if (description) {
    const readyForOffer =
      !makingOffer &&
      (pc.signalingState === "stable" || isSettingRemoteAnswerPending);
    const offerCollision = description.type === "offer" && !readyForOffer;

    ignoreOffer = !polite && offerCollision;
    if (ignoreOffer) return; // impolite peer wins the glare

    isSettingRemoteAnswerPending = description.type === "answer";
    // For the polite peer mid-collision, this implicitly rolls back
    // its own pending offer before applying the remote one.
    await pc.setRemoteDescription(description);
    isSettingRemoteAnswerPending = false;

    if (description.type === "offer") {
      await pc.setLocalDescription(); // creates the answer
      signaler.send({ description: pc.localDescription });
    }
  } else if (candidate) {
    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      if (!ignoreOffer) throw err; // candidate errors for ignored offers are expected
    }
  }
};
```

A rolled-back offer is not lost work: whatever the polite peer was trying to negotiate (a newly added track, say) simply fires `negotiationneeded` again once signaling returns to stable, and the change goes through on the next round. Attaching media and reacting to it is symmetric on both ends:

```js
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});
for (const track of stream.getTracks()) {
  pc.addTrack(track, stream); // fires the negotiationneeded handler above
}

pc.ontrack = ({ track, streams }) => {
  // Tracks start muted; wait for media to actually flow before wiring the element.
  track.onunmute = () => {
    if (remoteVideo.srcObject) return; // already attached
    remoteVideo.srcObject = streams[0];
  };
};
```

Data channels ride the same connection over SCTP, a message-oriented transport tunneled through the DTLS session and encrypted like everything else. Reliability is tunable per channel; a game's position updates can afford loss, a file transfer cannot:

```js
// Reliable, ordered (TCP-like) -- the default.
const fileChannel = pc.createDataChannel("file-transfer");

// Unordered, drop after one retransmit attempt (UDP-like).
const gameChannel = pc.createDataChannel("positions", {
  ordered: false,
  maxRetransmits: 1,
});

// Backpressure: never blindly push a large file into the buffer.
fileChannel.bufferedAmountLowThreshold = 256 * 1024;
fileChannel.onbufferedamountlow = () => sendNextChunk();
```

Connection health is observable and recoverable. `connectionState` reaching `"failed"` calls for an ICE restart, which renegotiates candidates without tearing down the session:

```js
pc.onconnectionstatechange = () => {
  if (pc.connectionState === "failed") {
    pc.restartIce(); // triggers negotiationneeded with new ICE credentials
  }
};
```

## Best Practices

- **MUST** deploy a TURN server for production. Symmetric NATs and enterprise firewalls make direct and STUN-derived paths impossible for a meaningful fraction of real users; without a `relay` fallback those calls simply fail.
- **MUST** implement the perfect negotiation pattern (polite/impolite roles, `makingOffer`, `ignoreOffer`) rather than ad-hoc caller/callee logic. Glare stops being an edge case the moment both sides can add tracks or channels at runtime.
- **MUST** call `track.stop()` on every capture track when a call ends. Closing the peer connection does not release the camera, microphone, or screen; the recording indicator stays on and users notice.
- **MUST** serve over HTTPS: `getUserMedia`, `getDisplayMedia`, and the rest of the capture surface exist only in secure contexts.
- **SHOULD** use trickle ICE (send candidates as `icecandidate` fires) instead of waiting for `iceGatheringState === "complete"`: connectivity checks start before gathering finishes, which is the setup-time win RFC 8838 exists to standardize.
- **SHOULD** watch `connectionState` and call `restartIce()` on `"failed"`; networks change (Wi-Fi to cellular) and sessions are expected to survive it.
- **SHOULD** respect data-channel backpressure via `bufferedAmount` and `bufferedamountlow`, and keep individual messages small: without a negotiated `max-message-size`, RFC 8841 specifies a 64 KB default, and large messages cause head-of-line blocking across every channel sharing the SCTP association.
- **SHOULD** monitor call quality with `getStats()` (packet loss, jitter, round-trip time, selected candidate pair) rather than waiting for user complaints.
- **MAY** use `RTCRtpScriptTransform` (Encoded Transforms, Baseline since 2025) to process encoded frames in a worker: the standard hook for end-to-end encryption across an SFU (Selective Forwarding Unit; see Design Thinking).
- **MAY** create data channels with `negotiated: true` and matching `id`s on both sides when the channel set is static, skipping in-band channel announcement.

## Design Thinking

**Signaling is deliberately unspecified.** The standard defines what peers say (SDP) but not how the messages travel. That is a real cost, since every team rebuilds a signaling layer, usually on WebSockets. What it buys is deployment freedom: signaling can piggyback on an existing session server, a queue, or a QR code, and the trust decision of who may call whom stays in the application where it belongs.

**Topology is the scaling decision.** Peer-to-peer *mesh* needs no media infrastructure, but every participant uploads to every other participant, so upstream bandwidth and encoding cost grow linearly with the group; in practice mesh caps at roughly a handful of peers. An *SFU* (Selective Forwarding Unit) terminates each peer's single upstream and forwards packets selectively to the others: server bandwidth scales, clients do not re-encode, and simulcast (the sender encodes the same video at several resolutions) lets the SFU pick a quality per receiver. This is the default architecture for group calling. An *MCU* (Multipoint Control Unit) decodes and mixes everything into one stream per client: cheapest for clients and legacy interop, most expensive on the server, and it forecloses per-receiver layout. Note that an SFU or MCU is itself "just" another WebRTC peer; the browser API does not change, and the topology lives entirely in infrastructure.

**Reliability is a per-channel dial.** By exposing `ordered`, `maxRetransmits`, and `maxPacketLifeTime` per data channel, WebRTC lets one connection carry TCP-like file transfer next to UDP-like telemetry. The cost is that the developer must actually choose: defaults are fully reliable, which silently turns a "real-time" channel into a latency amplifier on lossy links.

## Deep Dive

**ICE candidate types.** Each peer gathers `host` candidates (local interface addresses), `srflx` server-reflexive candidates (the public address a STUN server observed), and `relay` candidates (an address allocated on a TURN server that will forward traffic). `prflx` peer-reflexive candidates are discovered during connectivity checks themselves, typically behind symmetric NATs. ICE pairs local and remote candidates, checks them in priority order, and one agent (the *controlling* agent) nominates the pair that carries the session; `getStats()` exposes which pair won. End-of-candidates is signaled by an `icecandidate` event whose `candidate` is empty or null; forward it like any other candidate so the remote side can finish checking.

**The encrypted stack.** Media flows as SRTP and data as SCTP, both keyed through a DTLS handshake performed directly between the peers; there is no unencrypted mode in WebRTC. Certificate fingerprints ride in the SDP, so a tampered signaling channel is the main man-in-the-middle risk: protecting signaling with TLS and authenticating users there is part of the security model, not an optional extra. Firefox has defaulted to DTLS 1.3 since Firefox 127 (June 2024) and Chrome since early 2025; check current release notes for other engines.

**Encoded Transforms.** `RTCRtpScriptTransform` inserts a `TransformStream` running in a Worker between the encoder and the packetizer (with a mirror position on the receive side), operating on `RTCEncodedVideoFrame`/`RTCEncodedAudioFrame`. Because the transform sees encoded frames, it enables end-to-end encryption that an SFU cannot read while still letting the SFU route packets; the frames it forwards are opaque payloads. Safari shipped the standardized API in 2022, Firefox in 2023, and with Chrome's alignment the feature reached Baseline in October 2025.

**Renegotiation and ICE restarts.** Adding a track, changing directionality, or calling `restartIce()` fires `negotiationneeded` and runs the same offer/answer machinery over the existing connection. `setLocalDescription({ type: "rollback" })` returns to the last stable state; this is the primitive perfect negotiation leans on. An ICE restart issues new credentials and re-gathers candidates without interrupting already-flowing media until the new pair takes over, which is what makes network handoff survivable.

## Screen Capture and Display Surfaces

Screen sharing is the same pipeline with a different source: `navigator.mediaDevices.getDisplayMedia()` resolves to a `MediaStream` whose video track carries a *display surface*: a `"monitor"`, `"window"`, or `"browser"` tab, chosen by the user in a browser-drawn picker. The API is deliberately more restrictive than `getUserMedia`. It requires transient activation (a click), the site cannot preselect the surface, permission is granted per invocation rather than persisted, and `min`/`exact` constraints throw a `TypeError` so a site cannot force resolution on a surface it has not seen.

```js
const screen = await navigator.mediaDevices.getDisplayMedia({
  video: { displaySurface: "window" }, // a hint, not a guarantee
  audio: { suppressLocalAudioPlayback: true },
  selfBrowserSurface: "exclude",  // hide this tab from the picker (avoids hall-of-mirrors)
  surfaceSwitching: "include",    // let the user switch surfaces mid-capture
  monitorTypeSurfaces: "include",
  systemAudio: "exclude",
});
const [screenTrack] = screen.getVideoTracks();

// Share into an existing call: replaceTrack avoids renegotiation.
const sender = pc.getSenders().find((s) => s.track?.kind === "video");
await sender.replaceTrack(screenTrack);

// The browser's own "Stop sharing" UI ends the track -- observe it.
screenTrack.onended = () => sender.replaceTrack(cameraTrack);
```

The picker-shaping options in this sample (`selfBrowserSurface`, `surfaceSwitching`, `monitorTypeSurfaces`, `systemAudio`, and the related `preferCurrentTab`) are Chromium-only hints; other browsers ignore unknown dictionary members, so passing them everywhere is safe.

Two younger companions narrow what gets captured when a tab shares itself (`preferCurrentTab: true`): **Region Capture** (`CropTarget.fromElement()` plus `track.cropTo()`) crops the captured video to one element's rendered box, and **Element Capture** (`RestrictionTarget.fromElement()` plus `track.restrictTo()`) goes further by excluding occluding content entirely. A **CaptureController** passed in the options can additionally forward wheel events and zoom the captured tab (Captured Surface Control). These extensions are Chromium-led and not Baseline; treat them as progressive enhancements, and note that audio capture support differs per browser and per surface type. Every captured surface is a privacy exposure the user cannot fully assess mid-share; a notification that pops up during a whole-monitor share is visible to every viewer. Prefer `"window"`/`"browser"` sharing flows over whole-monitor defaults in your UI copy.

## Related Topics

- [WebSockets & Server-Sent Events](/en/Browser APIs and Web Platform/409)
- [WebTransport](/en/Browser APIs and Web Platform/411)
- [Web Workers & Concurrency](/en/Browser APIs and Web Platform/405)
- [Transferable Objects](/en/Browser APIs and Web Platform/417)
- [Fetch, Streams & Network APIs](/en/Browser APIs and Web Platform/403)

## References

- MDN contributors, "WebRTC API," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- MDN contributors, "Establishing a connection: The WebRTC perfect negotiation pattern," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
- MDN contributors, "WebRTC connectivity," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
- MDN contributors, "Using WebRTC data channels," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels
- MDN contributors, "MediaDevices: getDisplayMedia() method," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
- MDN contributors, "Screen Capture API," MDN Web Docs (2026). https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
- W3C, "WebRTC: Real-Time Communication in Browsers," W3C Recommendation (2021, maintained). https://www.w3.org/TR/webrtc/
- W3C, "WebRTC Encoded Transform," W3C Working Draft (2026). https://www.w3.org/TR/webrtc-encoded-transform/
- webstatus.dev, "WebRTC encoded transform," Web Platform Status (2026). https://webstatus.dev/features/webrtc-encoded-transform
- IETF, "RFC 8841: Session Description Protocol (SDP) Offer/Answer Procedures for Stream Control Transmission Protocol (SCTP) over Datagram Transport Layer Security (DTLS) Transport," IETF (2021). https://www.rfc-editor.org/rfc/rfc8841
- IETF, "RFC 8838: Trickle ICE," IETF (2021). https://www.rfc-editor.org/rfc/rfc8838
- Sean DuBois et al., "WebRTC for the Curious," webrtcforthecurious.com (maintained). https://webrtcforthecurious.com/
- Mozilla, "Bug 1884140: Enable DTLS 1.3 (Firefox 127)," Bugzilla (2024). https://bugzilla.mozilla.org/show_bug.cgi?id=1884140
- Chromium, "Issue 382915276: Launch DTLS 1.3," Chromium Issue Tracker (2025). https://issues.chromium.org/issues/382915276

## Changelog

- **2025** — Chrome shipped the standardized Encoded Transform (Chrome 141), taking `RTCRtpScriptTransform` to cross-browser Baseline in October; Chrome defaulted to DTLS 1.3 early in the year.
- **2024-06** — Firefox 127 defaulted to DTLS 1.3.
- **2023** — Firefox shipped the standardized Encoded Transform API (Safari had shipped it in 2022), replacing Chromium's earlier non-standard `createEncodedStreams()` design.
- **2021-01** — WebRTC 1.0 published as a W3C Recommendation.
