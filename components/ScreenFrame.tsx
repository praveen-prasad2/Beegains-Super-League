'use client';

/**
 * Shows one of the site's screens inside the admin panel, live and fully usable.
 * The embedded page scales its 1920x1080 stage to fit this frame and hides its own tab bar.
 */
export default function ScreenFrame({ href, label }: { href: string; label: string }) {
  return (
    <div className="card sf">
      <div className="sf-bar">
        <span className="h-title">
          <span className="cond">{label}</span>
        </span>
        <a href={href} target="_blank" rel="noopener" className="fx-link">
          Open full screen ↗
        </a>
      </div>
      <iframe className="sf-frame" src={href} title={`${label} screen`} />
    </div>
  );
}
