"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Worker = { name: string; phone: string; visible: boolean };

function normalizePhone(v: string) {
  return v.replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

function isSaudiMobile(v: string) {
  const p = normalizePhone(v);
  return /^05\d{8}$/.test(p) || /^(?:\+?966)5\d{8}$/.test(p);
}

export default function ProviderRegisterForm({ m }: { m: any }) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const t = m?.provider ?? {};

  const [ownerPhone, setOwnerPhone] = useState("");
  const [serviceType, setServiceType] = useState("camp");
  const [workArea, setWorkArea] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [agree, setAgree] = useState(false);

  const [workers, setWorkers] = useState<Worker[]>([]);

  function addWorker() {
    setWorkers([...workers, { name: "", phone: "", visible: false }]);
  }

  function removeWorker(index: number) {
    setWorkers(workers.filter((_, i) => i !== index));
  }

  function updateWorker(
    index: number,
    field: keyof Worker,
    value: string | boolean
  ) {
    const updated = [...workers];
    // @ts-ignore
    updated[index][field] = value;
    setWorkers(updated);
  }

  const ownerPhoneValid = useMemo(() => isSaudiMobile(ownerPhone), [ownerPhone]);
  const workAreaValid = useMemo(() => workArea.trim().length >= 2, [workArea]);

  const workersValid = useMemo(() => {
    for (const w of workers) {
      const phone = w.phone.trim();
      if (phone.length === 0) return false;
      if (!isSaudiMobile(phone)) return false;
    }
    return true;
  }, [workers]);

  const canSubmit = ownerPhoneValid && workAreaValid && agree && workersValid;

  function handleSubmit() {
    if (!canSubmit) return;

    const sp = new URLSearchParams();
    sp.set("service", serviceType);
    sp.set("area", workArea.trim());
    sp.set("cap", String(capacity));
    sp.set("workers", String(workers.length));

    router.push(`/${locale}/dashboard?${sp.toString()}`);
  }

  const serviceOptions = [
    { key: "camp", label: t?.serviceTypes?.camp ?? "Camp" },
    { key: "chalet", label: t?.serviceTypes?.chalet ?? "Chalet" },
    { key: "mobileTrip", label: t?.serviceTypes?.mobileTrip ?? "Mobile trip" }
  ];

  return (
    <section style={{ padding: "24px", maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>
        {t?.title ?? "Provider Registration"}
      </h1>

      <div style={{ marginBottom: "16px" }}>
        <label>{t?.ownerPhoneLabel ?? "Owner phone (required)"}</label>
        <input
          type="tel"
          placeholder={t?.ownerPhonePlaceholder ?? "05xxxxxxxx"}
          value={ownerPhone}
          onChange={(e) => setOwnerPhone(e.target.value)}
          style={{ width: "100%", marginTop: "6px" }}
        />
        <small
          style={{
            color:
              ownerPhone.length === 0 ? "#777" : ownerPhoneValid ? "#2e7d32" : "#b00020"
          }}
        >
          {ownerPhone.length === 0
            ? (t?.ownerPhoneHint ?? "")
            : ownerPhoneValid
            ? (t?.validPhone ?? "Valid")
            : (t?.invalidPhone ?? "Invalid")}
        </small>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>{t?.serviceTypeLabel ?? "Service type"}</label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          style={{ width: "100%", marginTop: "6px" }}
        >
          {serviceOptions.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>{t?.workAreaLabel ?? "Work area"}</label>
        <input
          type="text"
          placeholder={t?.workAreaPlaceholder ?? ""}
          value={workArea}
          onChange={(e) => setWorkArea(e.target.value)}
          style={{ width: "100%", marginTop: "6px" }}
        />
        <small
          style={{
            color: workArea.length === 0 ? "#777" : workAreaValid ? "#2e7d32" : "#b00020"
          }}
        >
          {workArea.length === 0
            ? (t?.workAreaHintEmpty ?? "")
            : workAreaValid
            ? (t?.workAreaHintOk ?? "")
            : (t?.workAreaHintShort ?? "")}
        </small>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label>{t?.capacityLabel ?? "Capacity"}</label>
        <select
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          style={{ width: "100%", marginTop: "6px" }}
        >
          <option value={1}>{t?.capacityOptions?.one ?? "1"}</option>
          <option value={2}>{t?.capacityOptions?.two ?? "2"}</option>
          <option value={3}>{t?.capacityOptions?.three ?? "3"}</option>
          <option value={4}>{t?.capacityOptions?.four ?? "4"}</option>
        </select>
      </div>

      <hr />
      <h3 style={{ margin: "16px 0" }}>{t?.workersTitle ?? "Workers (optional)"}</h3>

      {workers.length === 0 && (
        <p style={{ color: "#555", marginBottom: "12px" }}>
          {t?.workersEmptyHint ?? ""}
        </p>
      )}

      {workers.map((worker, index) => (
        <div
          key={index}
          style={{ border: "1px solid #ddd", padding: "12px", marginBottom: "12px" }}
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              placeholder={t?.workerNamePlaceholder ?? ""}
              value={worker.name}
              onChange={(e) => updateWorker(index, "name", e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeWorker(index)}
              style={{ background: "#fff", color: "#000", border: "1px solid #000" }}
            >
              {t?.removeWorker ?? "Remove"}
            </button>
          </div>

          <input
            type="tel"
            placeholder={t?.workerPhonePlaceholder ?? ""}
            value={worker.phone}
            onChange={(e) => updateWorker(index, "phone", e.target.value)}
            style={{ width: "100%", marginBottom: "6px" }}
          />

          <small
            style={{
              display: "block",
              marginBottom: "8px",
              color:
                worker.phone.length === 0
                  ? "#b00020"
                  : isSaudiMobile(worker.phone)
                  ? "#2e7d32"
                  : "#b00020"
            }}
          >
            {worker.phone.length === 0
              ? (t?.workerPhoneRequiredLine ?? "")
              : isSaudiMobile(worker.phone)
              ? (t?.validPhone ?? "Valid")
              : (t?.invalidPhone ?? "Invalid")}
          </small>

          <label>
            <input
              type="checkbox"
              checked={worker.visible}
              onChange={(e) => updateWorker(index, "visible", e.target.checked)}
            />{" "}
            {t?.showAfterConfirm ?? "Show after confirm"}
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addWorker}
        style={{ background: "#fff", color: "#000", border: "1px solid #000", marginTop: "4px" }}
      >
        {t?.addWorker ?? "+ Add worker"}
      </button>

      <div style={{ marginTop: "24px" }}>
        <label>
          <input checked={agree} onChange={(e) => setAgree(e.target.checked)} />{" "}
          {t?.agreeText ?? ""}
        </label>
      </div>

      {!workersValid && (
        <p style={{ color: "#b00020", marginTop: "12px" }}>
          {t?.workersInvalidBanner ?? ""}
        </p>
      )}

      <button onClick={handleSubmit} disabled={!canSubmit} style={{ marginTop: "24px", width: "100%" }}>
        {t?.submit ?? "Submit"}
      </button>

      <div style={{ marginTop: "12px", fontSize: "12px", color: "#666" }}>
        {t?.noOtpNote ?? ""}
      </div>
    </section>
  );
}
