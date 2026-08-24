// App-wide atmospheric backdrop: a soft azure sky with slowly drifting clouds.
// Rendered once behind everything (fixed, z-index -1) so every page shares the
// same "clear sky" surface. Pure CSS gradients — no image assets, no network.
export default function SkyBackground() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-glow" />
      <div className="cloud-band band-a" />
      <div className="cloud-band band-b" />
      <div className="cloud-band band-c" />
    </div>
  )
}
