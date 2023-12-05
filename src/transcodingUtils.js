import { S5Client } from "/node_modules/s5client-js/dist/mjs/index";

/**
 * Uploads a file to the server.
 * @param {File} file - The file to be uploaded.
 * @returns {Promise<string>} - The CID (Content Identifier) of the uploaded audio file.
 */
export const uploadFile = async (file) => {
  const customOptions = {
    encrypt: process.env.REACT_DEFAULT_IS_ENCRYPT === "true",
  };
  try {
    const headers = {};
    const customClientOptions = {
      portalUrl: process.env.REACT_APP_PORTAL_URL,
      authToken: process.env.REACT_APP_TOKEN,
      headers,
      withCredentials: false,
    };

    const client = new S5Client(
      process.env.REACT_APP_PORTAL_URL,
      customClientOptions
    );

    const response = await client.uploadFile(file, customOptions);
    console.log("transcodingUtils: uploadFile: response = ", response);

    const audioCID = response.cid;

    console.log("transcodingUtils: uploadFile: audioCID = ", audioCID);

    const url = response.encryptedBlobUrl;
    console.log(
      "transcodingUtils: uploadFile: response.encryptedBlobUrl = ",
      url
    );

    return audioCID;
  } catch (error) {
    console.error(error);
  }
  console.log("uploadFile2");
};

/**
 * Downloads a file from the specified CID.
 * @param {string} cid - The CID of the file to download.
 * @returns {Promise<void>} - A promise that resolves when the file is downloaded successfully.
 */
export const downloadFile = async (cid) => {
  const customOptions = { encrypt: false };
  try {
    console.log(
      "const response = await client.downloadFile(file, customOptions);"
    );

    const headers = {};
    const customClientOptions = {
      portalUrl: process.env.REACT_APP_PORTAL_URL,
      authToken: process.env.REACT_APP_TOKEN,
      headers,
      withCredentials: false,
    };

    // Instantiate the S5Client
    const clientDownload = new S5Client(
      process.env.REACT_APP_PORTAL_URL,
      customClientOptions
    );

    const downloadUrl = `${process.env.REACT_APP_PORTAL_DOWNLOAD_URL}${cid}`;
    const response = await clientDownload.downloadFile(
      downloadUrl,
      customOptions,
      {
        onProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Download progress: ${percentCompleted}%`);
        },
      }
    );
    console.log("transcodingUtils: downloadFile: downloadUrl = ", downloadUrl);
    console.log("transcodingUtils: downloadFile: response = ", response);

    const url = response;
    //        console.log("downloadFile: response.encryptedBlobUrl = ", url);

    const link = document.createElement("a");
    link.href = url;
    link.download = "encrypted-file.bin";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(
      "transcodingUtils: downloadFile: data = ",
      Array.from(response.data)
    );
    console.log(
      "transcodingUtils: downloadFile: data = ",
      Array.from(response.data)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  } catch (error) {
    console.log("hello");
    console.error(error);
  }
};

/**
 * Transcodes .wav audio using the specified audioCID and audioFormatsJSON to a .flac audio file.
 * @param {string} audioCID - The CID of the audio to transcode.
 * @param {Object[]} audioFormatsJSON - The JSON array of audio formats to transcode to.
 * @returns {Promise<Object>} - A promise that resolves to the transcoded audio data.
 */
export const transcodeAudio = async (audioCID, audioFormatsJSON) => {
  const isEncrypted = false;
  const isGPU = false;
  const url = `${
    process.env.REACT_APP_TRANSCODER_CLIENT_URL
  }/transcode?source_cid=${audioCID}&media_formats=${JSON.stringify(
    audioFormatsJSON
  )}&is_encrypted=${isEncrypted}&is_gpu=${isGPU}`;
  console.log("transcodingUtils: transcodeAudio: url = ", url);

  try {
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();
    console.log("transcodingUtils: transcodeAudio: data =", data);

    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Retrieves transcoded metadata for a given CID.
 * @param {string} cid - The CID (Content Identifier) of the transcoded file.
 * @returns {Promise<Object|null>} - A promise that resolves to the transcoded metadata object, or null if the metadata is not available yet.
 * @throws {Error} - Throws an error if there is an issue with the HTTP request or if there are network errors.
 */
export const getTranscodedMetadata = async (cid) => {
  if (!cid) return cid;

  const extensionIndex = cid.lastIndexOf(".");
  const cidWithoutExtension =
    extensionIndex === -1 ? cid : cid.slice(0, extensionIndex);

  const transcodeUrl = `${process.env.REACT_APP_TRANSCODER_CLIENT_URL}/get_transcoded/${cidWithoutExtension}`;
  console.log(
    "transcodingUtils: getTranscodedMetadata: transcoded url = ",
    transcodeUrl
  );

  try {
    const response = await fetch(transcodeUrl, { method: "GET" });
    console.log(
      "transcodingUtils: getTranscodedMetadata: response = ",
      response
    );

    if (!response.ok) {
      console.log(
        "transcodingUtils: getTranscodedMetadata: response.status = ",
        response.status
      );
      if (response.status === 404) {
        // The job might not be completed yet.
        return;
      } else {
        // There's an issue with the request itself, so throw an error to propagate the error to the caller.
        console.error(
          `transcodingUtils: getTranscodedMetadata: HTTP error: ${response.status}`
        );
        throw new Error(
          `transcodingUtils: getTranscodedMetadata: HTTP error: ${response.status}`
        );
      }
    } else {
      const data = await response.json();
      console.log("transcodingUtils: getTranscodedMetadata: data =", data);

      console.log(
        "transcodingUtils: getTranscodedMetadata: typeof data.metadata =",
        typeof data.metadata
      );

      const metadata = data.metadata ? JSON.parse(data.metadata) : null;
      console.log(
        "transcodingUtils: getTranscodedMetadata: metadata =",
        metadata
      );
      return metadata;
    }
  } catch (error) {
    // Network errors or other unexpected issues. Propagate the error to the caller.
    console.error(
      "transcodingUtils: getTranscodedMetadata: Unexpected error:",
      error
    );
    throw error;
  }
};
