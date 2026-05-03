const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });

const colors = {
  coal: [32, 38, 38, 255],
  cream: [248, 247, 241, 255],
  green: [23, 111, 83, 255],
  red: [244, 93, 72, 255],
  gold: [255, 200, 87, 255],
};

function makeIcon(size) {
  const data = Buffer.alloc(size * size * 4, 0);
  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  };

  const rect = (x, y, w, h, color) => {
    for (let yy = Math.round(y); yy < Math.round(y + h); yy += 1) {
      for (let xx = Math.round(x); xx < Math.round(x + w); xx += 1) set(xx, yy, color);
    }
  };

  const circle = (cx, cy, r, color) => {
    const rr = r * r;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rr) set(x, y, color);
      }
    }
  };

  const roundedBackground = () => {
    const radius = size * 0.2;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const rx = x < radius ? radius : x > size - radius ? size - radius : x;
        const ry = y < radius ? radius : y > size - radius ? size - radius : y;
        const dx = x - rx;
        const dy = y - ry;
        if (dx * dx + dy * dy <= radius * radius) set(x, y, colors.coal);
      }
    }
  };

  roundedBackground();
  circle(size / 2, size / 2, size * 0.34, colors.cream);

  rect(size * 0.2, size * 0.45, size * 0.1, size * 0.1, colors.coal);
  rect(size * 0.33, size * 0.35, size * 0.1, size * 0.3, colors.coal);
  rect(size * 0.57, size * 0.35, size * 0.1, size * 0.3, colors.coal);
  rect(size * 0.7, size * 0.45, size * 0.1, size * 0.1, colors.coal);
  rect(size * 0.42, size * 0.45, size * 0.16, size * 0.1, colors.red);

  for (let i = 0; i < size * 0.56; i += 1) {
    const x = size * 0.22 + i;
    const t = i / (size * 0.56);
    const y = size * 0.69 + Math.sin((t - 0.5) * Math.PI) * size * 0.06;
    circle(x, y, size * 0.027, colors.green);
  }

  circle(size * 0.66, size * 0.28, size * 0.035, colors.gold);
  return encodePng(size, size, data);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const name = Buffer.from(type);
  return Buffer.concat([u32(data.length), name, data, u32(crc32(Buffer.concat([name, data])))]); 
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

[180, 192, 512].forEach((size) => {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), makeIcon(size));
});
