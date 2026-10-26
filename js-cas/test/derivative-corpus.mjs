/* Shared 26-item Calculus I derivative regression corpus.
 * These are student-entered calculator expressions, not engine-native LaTeX.
 */
export const CORPUS = [
  'x^5', '3*x^2-5*x+7', '(x^2+3)^4', 'sin(x^2)', 'e^(3*x)', 'log(x)',
  'log(x^2+1)', 'sqrt(x)', 'sqrt(x^2+1)', '1/x', '1/x^2', 'x^2*e^x',
  'sin(x)/x', 'tan(x)', 'sec(x)', 'atan(x)', 'asin(x)', 'sin(cos(x))',
  'cos(x)^2', 'x^x', '2^x', '(2*x+1)^3*(x-4)^2', 'x/sqrt(x+1)', 'abs(x)',
  'sin(3*x)*cos(2*x)', 'e^(sin(x))'
];
// Positive points avoid the common obvious real-domain exclusions in this corpus.
// These points are NOT a proof of equivalence or a complete domain analysis.
export const POINTS = [0.2, 0.45, 0.7, 0.85];
