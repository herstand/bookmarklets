export function FlipMyVid() {
  FLIP_MY_VID_vid=document.querySelectorAll("video");
  FLIP_MY_VID_lastVid=FLIP_MY_VID_vid[FLIP_MY_VID_vid.length-1];
  FLIP_MY_VID_lastVidTransform=FLIP_MY_VID_lastVid.style.transform ? FLIP_MY_VID_lastVid.style.transform.substring(7,FLIP_MY_VID_lastVid.style.transform.length-1) : "";
  FLIP_MY_VID_lastVidTransformVal = FLIP_MY_VID_lastVidTransform ? /([^(^)]+)[)]+/.exec(FLIP_MY_VID_lastVidTransform)[1] : "";
  FLIP_MY_VID_lastVid.style.transform=`scaleX(calc(${FLIP_MY_VID_lastVidTransform ? `${FLIP_MY_VID_lastVidTransformVal}*-1)`:`calc(1)`})`;
}
