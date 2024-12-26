let audioContext;
let source;
let isPlaying = false;
let previousTime = 0;
let gainNode;
let backgroundColor = 'rgb(0, 0, 2)'; // Customizable background color

document.getElementById("audio").addEventListener("change", (event) => {
  const file = event.target.files[0];

  const reader = new FileReader();

  reader.addEventListener("load", (event) => {
    const arrayBuffer = event.target.result;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      visualize(audioBuffer);
    });
  });

  reader.readAsArrayBuffer(file);
});

function visualize(audioBuffer) {
  const canvas = document.getElementById("canvas");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  const frequencyBufferLength = analyser.frequencyBinCount;
  const frequencyData = new Uint8Array(frequencyBufferLength);

  gainNode = audioContext.createGain(); // For volume control

  // Function to create a new source and connect it
  function createSource() {
    if (source) {
      source.stop(0); // Stop the current source before creating a new one
      source.disconnect(); // Disconnect the old source
    }
    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true; // Optional: loop the audio

    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);
  }

  createSource(); // Initialize the first source
  source.start(0); // Start playing the audio
  isPlaying = true;

  const canvasContext = canvas.getContext("2d");

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width / 2, canvas.height / 2) / 3;
  const barWidth = 2 * Math.PI / frequencyBufferLength;

  // Event listener for pause/play button
  document.getElementById("pause").addEventListener("click", () => {
    if (isPlaying) {
      previousTime = audioContext.currentTime; // Store the current time when paused
      source.stop(0); // Stop the current source
      isPlaying = false;
    } else {
      createSource(); // Create a new source
      source.start(0, previousTime); // Start the new source from the previous time
      isPlaying = true;
    }
  });

  // Event listener for volume control
  document.getElementById("volume").addEventListener("input", (event) => {
    gainNode.gain.value = event.target.value;
  });

  // Function to draw the audio visualization
  function draw() {
    requestAnimationFrame(draw);
    canvasContext.fillStyle = backgroundColor; // Use the customizable background color
    canvasContext.fillRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    analyser.getByteFrequencyData(frequencyData);

    for (let i = 0; i < frequencyBufferLength; i++) {
      const angle = i * barWidth;
      const barHeight = frequencyData[i] / 2;

      const x1 = centerX + radius * Math.cos(angle);
      const y1 = centerY + radius * Math.sin(angle);
      const x2 = centerX + (radius + barHeight) * Math.cos(angle);
      const y2 = centerY + (radius + barHeight) * Math.sin(angle);

      // Generate a vibrant gradient color for each bar
      const gradient = canvasContext.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, `hsl(${(angle * 360) / (2 * Math.PI)}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${(angle * 360) / (2 * Math.PI) + 90}, 100%, 50%)`);

      canvasContext.strokeStyle = gradient;
      canvasContext.lineWidth = 2;
      canvasContext.beginPath();
      canvasContext.moveTo(x1, y1);
      canvasContext.lineTo(x2, y2);
      canvasContext.stroke();
    }
  }

  draw(); // Start the drawing loop
}
