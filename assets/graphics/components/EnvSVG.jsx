import * as React from "react"
import Svg, { G, Path } from "react-native-svg"
const SvgComponent = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} {...props}>
    <G fillRule="evenodd">
      <Path
        fill="#1B9D37"
        d="M24 0c13.246 0 24 10.754 24 24S37.246 48 24 48 0 37.246 0 24 10.754 0 24 0z"
      />
      <G fill="#FFF">
        <Path d="M34.5 11v7.95L39 23h-4.5v12h-9v-9h-3v9h-9V23H9L24 9.5l6 5.4V11h4.5zm-6 21h3V20.285l-7.5-6.75-7.5 6.75V32h3v-9h9v9z" />
        <Path d="M21 20h6c0-1.65-1.35-3-3-3s-3 1.35-3 3z" />
      </G>
    </G>
  </Svg>
)
export default SvgComponent
