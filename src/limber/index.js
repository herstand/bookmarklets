const AutomateOutcomesAssessment = () => {
  function chooseFeet() {
    const [feetEl] = document.body.querySelectorAll("[data-testid='dropdown-input']");
    const eventFt = new InputEvent('input', { bubbles: true, cancelable: true, composed: true });
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(feetEl, "1");
    feetEl.dispatchEvent(eventFt);
    feetEl.parentElement.parentElement.parentElement.parentElement.querySelector("[id^='react-select-'][id$='-option-1']").click();
  }
  function chooseInches() {
    const [_, inchesEl] = document.body.querySelectorAll("[data-testid='dropdown-input']");
    const eventInches = new InputEvent('input', { bubbles: true, cancelable: true, composed: true });
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inchesEl, "1");
    inchesEl.dispatchEvent(eventInches);
    inchesEl.parentElement.parentElement.parentElement.parentElement.querySelector("[id^='react-select-'][id$='-option-1']").click();
  }
  function chooseWeight() {
    const weightEl = document.body.querySelector("[data-testid='weight-height-lbs']");
    const eventWeight = new InputEvent('input', { bubbles: true, cancelable: true, composed: true });
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(weightEl, "1");
    weightEl.dispatchEvent(eventWeight);
  }
  function clickThrough() {
    if (document.body.querySelector("[data-testid='button']")) {
      if (document.body.querySelector("[data-testid='input'][inputmode='numeric']")) {
        const inputEl = document.body.querySelector("[data-testid='input']");
        const inputEvent = new InputEvent('input', { bubbles: true, cancelable: true, composed: true });
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inputEl, "01/01/1990");
        inputEl.dispatchEvent(inputEvent);
      } else if (document.body.querySelector("[data-testid='dropdown-input']")) {
        chooseFeet();
        setTimeout(chooseInches, 100);
        setTimeout(chooseWeight, 200);
      } else {
        document.body.querySelector("[data-testid='choice']")?.click();
      }
      document.body.querySelector("[data-testid='button']")?.click();
      setTimeout(clickThrough, 100);
    }
  }
  clickThrough();
};

const code = AutomateOutcomesAssessment.toString();
const AutomateOutcomesAssessmentURI = encodeURI(`javascript:(${code})()`);
export default AutomateOutcomesAssessmentURI;
