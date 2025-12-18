export const dynamic = "force-dynamic";

export default function AdminLoginAR() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>تسجيل دخول الأدمن</h1>
        <p style={{ color: "#666", marginTop: 8, fontSize: 13 }}>
          أدخل بيانات الأدمن للدخول إلى لوحة الطلبات.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);
            const username = String(fd.get("username") || "");
            const password = String(fd.get("password") || "");

            const res = await fetch("/api/admin/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) {
              alert(data?.error || "فشل تسجيل الدخول");
              return;
            }

            window.location.href = "/ar/admin/requests";
          }}
          style={{
            marginTop: 14,
            background: "#fff",
            border: "1px solid #e7e7e7",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <label style={{ display: "block", fontSize: 12, fontWeight: 800 }}>اسم المستخدم</label>
          <input
            name="username"
            autoComplete="username"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />

          <label style={{ display: "block", marginTop: 12, fontSize: 12, fontWeight: 800 }}>
            كلمة المرور
          </label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />

          <button
            type="submit"
            style={{
              marginTop: 14,
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            دخول
          </button>
        </form>
      </div>
    </main>
  );
}
