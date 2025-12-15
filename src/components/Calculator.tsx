import { CalculatorProvider } from "./calculator/CalculatorContext";
import { CalculatorView } from "./calculator/CalculatorView";

const Calculator = () => (
  <CalculatorProvider>
    <CalculatorView />
  </CalculatorProvider>
);

export default Calculator;
