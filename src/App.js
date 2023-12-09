// Title: Audio Transcoding and Playback Example Application

// Summary: This program is a React application that allows users to upload audio files to decentralised SIA storage via S5,
// transcode them into a specified format, and play back the transcoded audio via S5. It utilises utility functions for file upload, transcoding, and metadata retrieval.
// Users can also download the original audio file and refresh the transcoded audio.

import React, { useState } from "react";
import "./App.css";
import {
  uploadFile,
  downloadFile,
  transcodeAudio,
  getTranscodedMetadata,
} from "./transcodingUtils"; // Import utility functions

/**
 * Renders the main application component.
 *
 * @returns {JSX.Element} The rendered application component.
 */
function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioCID, setAudioCID] = useState(null);
  const [transcodedAudioUrl, setTranscodedAudioUrl] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      const audioCID = await uploadFile(file);
      setAudioCID(audioCID);
    }
  };

  /**
   * Handles the transcode operation.
   * @returns {Promise<void>} A promise that resolves when the transcode operation is queued for processing.
   */
  const handleTranscode = async () => {
    const videoFormatsJSON = [
      {
        id: 16,
        label: "1600k",
        type: "audio/flac",
        ext: "flac",
        acodec: "flac",
        ch: 2,
        ar: "48k",
      },
    ];
    // This function handles the transcode API call
    await transcodeAudio(audioCID, videoFormatsJSON);
  };

  /**
   * Handles the refresh action.
   * Retrieves the transcoded metadata for the audioCID and sets the transcoded audio URL.
   * @returns {Promise<void>} A promise that resolves when the refresh action is completed.
   */
  const handleRefresh = async () => {
    const metadata = await getTranscodedMetadata(audioCID);
    if (metadata && metadata.length > 0) {
      const audioFormat = metadata[0];
      const audioUrl = `${process.env.REACT_APP_PORTAL_DOWNLOAD_URL}${audioFormat.cid}?mediaType=audio%2flac}`;
      console.log("transcodingUtils: getTranscodedMetadata: url = ", audioUrl);
      setTranscodedAudioUrl(audioUrl); // Assuming 'cid' is the correct property for the URL
    }
  };

  return (
    <div className="App">
      <h1>Upload Audio (client)</h1>
      <input type="file" accept=".wav" onChange={handleFileChange} />
      <button onClick={() => downloadFile(audioCID)}>Download</button>
      <div>
        {`${process.env.REACT_APP_PORTAL_DOWNLOAD_URL}${audioCID}?mediaType=audio%2wav`}
      </div>

      <h2>Transcode Audio</h2>
      <button onClick={handleTranscode}>Submit</button>
      <h2>Fetch Audio</h2>
      <button onClick={handleRefresh}>Submit</button>
      {transcodedAudioUrl && (
        <audio controls>
          <source src={transcodedAudioUrl} type="audio/flac" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}

export default App;
