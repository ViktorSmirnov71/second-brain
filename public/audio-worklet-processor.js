class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2048;
    this._buffer = new Float32Array(this._bufferSize);
    this._bytesWritten = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bytesWritten++] = channelData[i];

      if (this._bytesWritten >= this._bufferSize) {
        this._flush();
      }
    }

    return true;
  }

  _flush() {
    // Downsample from AudioContext sample rate (typically 48000) to 16000
    const inputSampleRate = sampleRate; // global in AudioWorklet scope
    const outputSampleRate = 16000;
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(this._bytesWritten / ratio);
    const output = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const index = Math.floor(i * ratio);
      // Clamp and convert Float32 [-1, 1] to Int16 [-32768, 32767]
      const sample = Math.max(-1, Math.min(1, this._buffer[index]));
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    this.port.postMessage(output.buffer, [output.buffer]);

    this._bytesWritten = 0;
    this._buffer = new Float32Array(this._bufferSize);
  }
}

registerProcessor("audio-processor", AudioProcessor);
