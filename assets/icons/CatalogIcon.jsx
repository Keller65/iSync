import Svg, { Path } from "react-native-svg"
const CatalogIcon = (props) => (
  <Svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill={props.color || "currentColor"}
  >
    <Path
      d="M20 22V2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3ZM8 6h8v2H8ZM6 19a1 1 0 0 1 .31-.71A.93.93 0 0 1 7 18h11v2H7a1 1 0 0 1-1-1Z"
      data-name="Layer 2"
    />
  </Svg>
)
export default CatalogIcon