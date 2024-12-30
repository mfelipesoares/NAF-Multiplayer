function genClientId() {
    return String(crypto.getRandomValues(new Uint32Array(1))[0]);
  }

  const state = {};
  state.micEnabled = true; // set it to false if you want to be muted initially.
  state.currentStream = null;
  state.cameraEnabled = false;
  state.sceneStreamingEnabled = false;

  // Prompt for audio.
  document.addEventListener("DOMContentLoaded", () => {
    const scene = document.querySelector("a-scene");
    const micBtnEl = document.getElementById("mic-btn");
    const cameraBtnEl = document.getElementById("camera-btn");

    // Handle mic button click (Mute and Unmute)
    micBtnEl.addEventListener("click", function () {
      NAF.connection.adapter.enableMicrophone(!state.micEnabled);
      state.micEnabled = !state.micEnabled;
      micBtnEl.textContent = state.micEnabled ? "Ligar Mic" : "Unmute Mic";
    });
    micBtnEl.textContent = state.micEnabled ? "Mute Mic" : "Unmute Mic";

    const stopAndRemoveVideoTrack = async () => {
      const videoTracks = state.currentStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].stop();
        state.currentStream.removeTrack(videoTracks[0]);
        await NAF.connection.adapter.setLocalMediaStream(state.currentStream);
      }
    };

    // Handle camera button click (Show and Hide)
    cameraBtnEl.addEventListener("click", async () => {
      if (state.sceneStreamingEnabled) {
        await stopAndRemoveVideoTrack();
        state.sceneStreamingEnabled = false;
        sceneBtnEl.textContent = "Start streaming scene";
      }

      if (state.cameraEnabled) {
        await stopAndRemoveVideoTrack();
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { mediaSource: "camera", width: { max: 1280, ideal: 640 }, height: { ideal: 360 }, frameRate: 30 },
        });
        state.currentStream.addTrack(stream.getVideoTracks()[0]);
        await NAF.connection.adapter.setLocalMediaStream(state.currentStream);
        
        var secondCameraEl = document.querySelector('#second-camera');
        secondCameraEl.setAttribute('camera', 'active', true);
        const scene = document.querySelector("a-scene");
        const box = document.querySelector("#rig");
        scene.removeChild(box);
        console.log("Entidade removida!");
        let button = cameraBtnEl;
        button.classList.add("hidden"); // Adiciona a classe que oculta o botão
        button = micBtnEl;
        button.classList.add("hidden"); // Adiciona a classe que oculta o botão
      }

      state.cameraEnabled = !state.cameraEnabled;
      cameraBtnEl.textContent = state.cameraEnabled ? "Hide Camera" : "Show Camera";
    });



    // TODO add example of tab screenshare with audio
    // audioSystem.addStreamToOutboundAudio("screenshare", newStream);

    scene.addEventListener("adapter-ready", ({ detail: adapter }) => {
      // We don't use the syncOccupants API, set requestedOccupants to be the same array instance as availableOccupants
      adapter.requestedOccupants = adapter.availableOccupants;
      const clientId = genClientId(); // generate a random 16 characters string, but you can use a uuid4 for example
      adapter.setClientId(clientId);
      navigator.mediaDevices
        .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }})
        .then((stream) => {
          const audioSystem = scene.systems.audio;
          audioSystem.addStreamToOutboundAudio("microphone", stream);
          state.currentStream = audioSystem.outboundStream;
          adapter.setLocalMediaStream(audioSystem.outboundStream).then(() => {
            // Note that networked-scene audio:true option has no effect with the janus adapter
            adapter.enableMicrophone(state.micEnabled);
          });
        })
        .catch((err) => {
          console.warn("Microphone access not allowed. This client will not broadcast audio.");
        });
    });
  });

  // Called by Networked-Aframe when connected to server
  function onConnect() {
    console.log("onConnect", new Date());
  }