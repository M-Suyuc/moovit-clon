
import { getStyle } from "@/actions/get-styles";
import { Map } from "@/components/MapLibre";

const MapMapLibre = async () => {
  const styles = await getStyle()
  return (
    <div>
      <Map style={styles} />
    </div>
  )
}

export default MapMapLibre
