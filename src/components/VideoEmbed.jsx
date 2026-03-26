import { G } from "../styles";

// ─── URL parsers ─────────────────────────────────────────────────────────────

function parseVideoUrl(url) {
  if (!url) return null;

  // YouTube: watch?v=, youtu.be, shorts/, live/
  let m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (m) return { platform: "youtube", id: m[1] };

  // Instagram: /p/, /reel/, /tv/
  m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (m) return { platform: "instagram", id: m[1] };

  // Facebook: /videos/, /watch?v=
  m = url.match(/facebook\.com\/(?:[^/]+\/videos\/|watch\/?\?v=)(\d+)/);
  if (m) return { platform: "facebook", id: m[1] };

  return null;
}

function PlatformIcon({ platform, size = 14 }) {
  const icons = {
    youtube:   { symbol: "▶", color: "#ff0000" },
    instagram: { symbol: "◈", color: "#e1306c" },
    facebook:  { symbol: "f", color: "#1877f2" },
    unknown:   { symbol: "⏵", color: G.textDim },
  };
  const { symbol, color } = icons[platform] || icons.unknown;
  return (
    <span style={{ color, fontSize: size, lineHeight: 1, fontFamily: "sans-serif", fontWeight: "bold" }}>
      {symbol}
    </span>
  );
}

function YouTubeEmbed({ id }) {
  return (
    <iframe
      title={`YouTube video ${id}`}
      src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}

function InstagramEmbed({ id }) {
  return (
    <iframe
      title={`Instagram post ${id}`}
      src={`https://www.instagram.com/p/${id}/embed/`}
      allowFullScreen
      scrolling="no"
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}

function FacebookEmbed({ id }) {
  const encoded = encodeURIComponent(`https://www.facebook.com/watch/?v=${id}`);
  return (
    <iframe
      title={`Facebook video ${id}`}
      src={`https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&appId`}
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      style={{ width: "100%", height: "100%", border: "none", display: "block", overflow: "hidden" }}
      scrolling="no"
    />
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function VideoEmbed({ url, style = {}, aspectRatio = "16/9" }) {
  const parsed = parseVideoUrl(url);

  const wrapper = {
    width: "100%",
    aspectRatio,
    background: G.bg,
    border: `1px solid ${G.border}`,
    overflow: "hidden",
    position: "relative",
    ...style,
  };

  if (!parsed) {
    return (
      <div style={{ ...wrapper, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 11, color: G.textDim }}>Unsupported video URL</span>
        <span style={{ fontSize: 10, color: G.textDim, wordBreak: "break-all", maxWidth: "90%", textAlign: "center" }}>{url}</span>
      </div>
    );
  }

  return (
    <div style={wrapper}>
      {parsed.platform === "youtube"   && <YouTubeEmbed id={parsed.id} />}
      {parsed.platform === "instagram" && <InstagramEmbed id={parsed.id} />}
      {parsed.platform === "facebook"  && <FacebookEmbed id={parsed.id} />}
    </div>
  );
}

// ─── Re-export helpers for use in other components ───────────────────────────
export { parseVideoUrl, PlatformIcon };