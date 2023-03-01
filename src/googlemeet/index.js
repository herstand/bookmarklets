const FlipMyVid = () => {
  const video = document.querySelectorAll("video");
  const lastVideo = video[video.length-1];
  const lastVideoTransformVal = lastVideo.style.transform ? lastVideo.style.transform.substring(7,lastVideo.style.transform.length-1) : "";
  const lastVideoTransformVal_number = lastVideoTransformVal ? /([^(^)]+)[)]+/.exec(lastVideoTransformVal)[1] : "";
  lastVideo.style.transform = `scaleX(calc(${lastVideoTransformVal_number ? `${lastVideoTransformVal_number}*-1)`:`calc(1)`})`;
}

const code = FlipMyVid.toString();
const FlipMyVidURI = encodeURI(`javascript:(${code})()`);
export default FlipMyVidURI;