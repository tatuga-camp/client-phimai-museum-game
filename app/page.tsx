import Image from "next/image";

export default function Home() {
  return (
    <main className="page center">
      <div
        style={{ fontSize: 64, marginTop: 60 }}
        className="flex items-center justify-center"
      >
        <Image
          src="/full-logo.svg"
          alt="Phimai Treasure Hunt"
          width={100}
          height={100}
        />
      </div>
      <h1>Phimai Treasure Hunt</h1>
      <p className="hint">ล่าสมบัติพิมาย</p>
      <div className="card" style={{ marginTop: 24 }}>
        <p>
          Scan your QR card to join! <br />
          <span className="hint">สแกนคิวอาร์โค้ดเพื่อเข้าร่วม</span>
        </p>
      </div>
    </main>
  );
}
