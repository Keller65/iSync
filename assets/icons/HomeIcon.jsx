// import Svg, { Path } from "react-native-svg"
// const HomeIcon = (props) => (
//   <Svg
//     xmlns="http://www.w3.org/2000/svg"
//     fill={props.color || "currentColor"}
//     className="size-6"
//     viewBox="0 0 24 24"
//     width={props.size || 24}
//     height={props.size || 24}
//     {...props}
//   >
//     <Path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
//     <Path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
//   </Svg>
// )
// export default HomeIcon

import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
  <Svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill={props.color || "currentColor"}
  >
    <Path d="m21.12 9.79-7-7a3.08 3.08 0 0 0-4.24 0l-7 7A3 3 0 0 0 2 11.91v7.18a3 3 0 0 0 3 3h4v-6a3 3 0 0 1 6 0v6h4a3 3 0 0 0 3-3v-7.18a3 3 0 0 0-.88-2.12Z" />
  </Svg>
)
export default SvgComponent
