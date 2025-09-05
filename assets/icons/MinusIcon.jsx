import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="size-6"
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    {...props}
  >
    <Path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </Svg>
)
export default SvgComponent