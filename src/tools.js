import FlipMyVidURI from "./googlemeet/index.js";
import MoveTeamsTilesURI from "./teams/index.js";
import AutomateOutcomesAssessmentURI from "./limber/index.js";

export default [
  {
    id: "limber-health",
    name: "Limber Health",
    accent: "#2e2758",
    monogram: "L",
    tools: [
      {
        id: "limber-automate-outcomes-assessment",
        name: "Automate an Outcomes Assessment",
        label: "Automate OC",
        href: AutomateOutcomesAssessmentURI,
        summary: "Fills in and clicks through every step of a Limber Health outcomes assessment so you can test the flow in seconds.",
        steps: [
          "Open an outcomes assessment in Limber Health.",
          "Click the bookmark and watch it complete each step."
        ],
        notes: "Uses placeholder answers: the first choice on each question, a date of birth of 01/01/1990, and 1 for height and weight. Meant for testing, never for real patient data."
      }
    ]
  },
  {
    id: "google-meet",
    name: "Google Meet",
    accent: "#00897b",
    monogram: "GM",
    tools: [
      {
        id: "google-meet-mirror-video",
        name: "Mirror My Video",
        label: "Mirror My Video",
        href: FlipMyVidURI,
        summary: "Flips your own camera preview so it matches what you see in a mirror.",
        steps: [
          "Join a Google Meet meeting.",
          "Click the bookmark to mirror your video.",
          "Click it again to flip back."
        ],
        notes: "Google resets your video whenever someone joins or leaves the call. Click the bookmark again to mirror it again."
      }
    ]
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    accent: "#5b5fc7",
    monogram: "T",
    tools: [
      {
        id: "teams-move-tiles",
        name: "Move Video Tiles",
        label: "Teams: Move Tiles",
        href: MoveTeamsTilesURI,
        summary: "Rearranges the meeting gallery by dragging tiles into new spots, the way Zoom lets you.",
        steps: [
          "Join a Teams meeting in your browser and click the bookmark.",
          "Drag any participant's tile onto the spot where you want it. The other tiles slide over to make room and everything snaps back into the grid.",
          "Click the bookmark again to restore the usual order and turn arranging off."
        ],
        notes: "Works in the regular gallery and in the thumbnail strip while someone shares their screen. Press Escape mid-drag to cancel. Buttons inside a tile still work; only dragging the tile itself moves it. Your order is kept for each person when cameras go on or off or when Teams rearranges the gallery, and it only changes what you see."
      }
    ]
  }
];
