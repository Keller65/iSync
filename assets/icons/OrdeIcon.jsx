import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
  <Svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    fill={props.color || "currentColor"}
    className="icon icon-tabler icons-tabler-filled icon-tabler-layout-board"
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M5 3h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2M14 3h5a2 2 0 0 1 2 2v8a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1M14 16h6a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1M4 10h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-8a1 1 0 0 1 1-1" />
  </Svg>
)
export default SvgComponent
