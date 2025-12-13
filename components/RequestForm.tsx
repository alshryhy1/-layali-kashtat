"use client";

import { useMemo, useState } from "react";

type SupplyMode = "cookOnly" | "meatOnly" | "full" | "none";
type TripType = "camp" | "chalet" | "mobile";
type MobileRoute = "single" | "multi";

type MeatKind = "goat" | "sheep" | "camel" | "beef";
type MeatCut = "full" | "half" | "quarter" | "kilo";

export default function RequestForm({ m }: { m: any }) {
  const t = m?.request ?? {};

  const [tripType, setTripType] = useState<TripType>("camp");
  const [mobileRoute, setMobileRoute] = useState<MobileRoute>("single");

  const [date, setDate] = useState("");
  const [days, setDays] = useState<number>(1);
  const [people, setPeople] = useState<number>(10);
  const [location, setLocation] = useState("");
  const [hasKids, setHasKids] = useState(false);

  const [supply, setSupply] = useState<SupplyMode>("none");
  const foodEnabled = supply !== "none";

  const [meatEnabled, setMeatEnabled] = useState(false);
  const [meatKind, setMeatKind] = useState<MeatKind>("sheep");
  const [meatCut, setMeatCut] = useState<MeatCut>("full");
  const [meatKilos, setMeatKilos] = useState<number>(10);

  const [birdsEnabled, setBirdsEnabled] = useState(false);
  const [birdsType, setBirdsType] = useState("Chicken");
  const [birdsQty, setBirdsQty] = useState<number>(5);
  const [birdsCook, setBirdsCook] = useState("Grill");

  const [fishEnabled, setFishEnabled] = useState(false);
  const [fishType, setFishType] = useState("Hamour");
  const [fishKilos, setFishKilos] = useState<number>(5);
  const [fishCook, setFishCook] = useState("Fried");

  const [tent, setTent] = useState<"none" | "one" | "two" | "majlis">("none");
  const [tentSize, setTentSize] = useState("");
  const [tv, setTv] = useState(false);
  const [portableToilet, setPortableToilet] = useState(false);

  const [kidsGames, setKidsGames] = useState(false);
  const [quads, setQuads] = useState(false);
  const [youthGames, setYouthGames] = useState(false);
  const [baloot, setBaloot] = useState(false);
  const [hind, setHind] = useState(false);

  const safetyShouldShow = useMemo(() => {
    const hasEquip = tent !== "none" || tv || portableToilet;
    const hasFun = kidsGames || quads || youthGames || baloot || hind;
    return hasKids || hasEquip || hasFun;
  }, [hasKids, tent, tv, portableToilet, kidsGames, quads, youthGames, baloot, hind]);

  function handleSupplyChange(v: SupplyMode) {
    setSupply(v);
    if (v === "none") {
      setMeatEnabled(false);
      setBirdsEnabled(false);
      setFishEnabled(false);
    }
  }

  const meatCutsAllowed: MeatCut[] = useMemo(() => {
    if (meatKind === "camel" || meatKind === "beef") return ["kilo"];
    return ["full", "half", "quarter", "kilo"];
  }, [meatKind]);

  function handleMeatKindChange(v: MeatKind) {
    setMeatKind(v);
    if ((v === "camel" || v === "beef") && meatCut !== "kilo") {
      setMeatCut("kilo");
    }
  }

  function submitFake() {
    alert("Demo only");
  }

  const L = (path: string, fallback: string) => {
    const parts = path.split(".");
    let cur: any = t;
    for (const p of parts) cur = cur?.[p];
    return cur ?? fallback;
  };

  return (
    <section style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>{t?.title ?? "Request"}</h1>

      <div style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px" }}>
        <strong>{L("sections.tripType", "Trip type")}</strong>
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <select value={tripType} onChange={(e) => setTripType(e.target.value as TripType)}>
            <option value="camp">{L("tripTypes.camp", "Camp")}</option>
            <option value="chalet">{L("tripTypes.chalet", "Chalet")}</option>
            <option value="mobile">{L("tripTypes.mobile", "Mobile")}</option>
          </select>

          {tripType === "mobile" && (
            <select value={mobileRoute} onChange={(e) => setMobileRoute(e.target.value as MobileRoute)}>
              <option value="single">{L("mobileRoute.single", "Single")}</option>
              <option value="multi">{L("mobileRoute.multi", "Multi")}</option>
            </select>
          )}
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px" }}>
        <strong>{L("sections.basics", "Basics")}</strong>

        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <label>
            {L("basicsFields.date", "Date")}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} />
          </label>

          <label>
            {L("basicsFields.days", "Days")}
            <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: "100%" }} />
          </label>

          <label>
            {L("basicsFields.people", "People")}
            <input type="number" min={1} value={people} onChange={(e) => setPeople(Number(e.target.value))} style={{ width: "100%" }} />
          </label>

          <label>
            {L("basicsFields.location", "Location")}
            <input
              type="text"
              placeholder={L("basicsFields.locationPlaceholder", "")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <input type="checkbox" checked={hasKids} onChange={(e) => setHasKids(e.target.checked)} />{" "}
            {L("basicsFields.hasKids", "Kids?")}
          </label>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px" }}>
        <strong>{L("sections.supply", "Supply")}</strong>
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <select value={supply} onChange={(e) => handleSupplyChange(e.target.value as SupplyMode)}>
            <option value="cookOnly">{L("supplyModes.cookOnly", "Cooking only")}</option>
            <option value="meatOnly">{L("supplyModes.meatOnly", "Meat only")}</option>
            <option value="full">{L("supplyModes.full", "Full")}</option>
            <option value="none">{L("supplyModes.none", "None")}</option>
          </select>

          {!foodEnabled && <small style={{ color: "#777" }}>{L("supplyNoteNoFood", "")}</small>}
        </div>
      </div>

      {foodEnabled && (
        <div style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px" }}>
          <strong>{L("sections.food", "Food")}</strong>

          <div style={{ marginTop: "10px", display: "grid", gap: "14px" }}>
            <div style={{ border: "1px dashed #bbb", padding: "12px" }}>
              <label>
                <input type="checkbox" checked={meatEnabled} onChange={(e) => setMeatEnabled(e.target.checked)} />{" "}
                {L("foodBlocks.meat", "Meat")}
              </label>

              {meatEnabled && (
                <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
                  <label>
                    {L("meat.kind", "Kind")}
                    <select value={meatKind} onChange={(e) => handleMeatKindChange(e.target.value as MeatKind)}>
                      <option value="goat">{L("meat.kinds.goat", "Goat")}</option>
                      <option value="sheep">{L("meat.kinds.sheep", "Sheep")}</option>
                      <option value="camel">{L("meat.kinds.camel", "Camel")}</option>
                      <option value="beef">{L("meat.kinds.beef", "Beef")}</option>
                    </select>
                  </label>

                  <label>
                    {L("meat.amount", "Amount")}
                    <select value={meatCut} onChange={(e) => setMeatCut(e.target.value as MeatCut)}>
                      {meatCutsAllowed.includes("full") && <option value="full">{L("meat.cuts.full", "Full")}</option>}
                      {meatCutsAllowed.includes("half") && <option value="half">{L("meat.cuts.half", "Half")}</option>}
                      {meatCutsAllowed.includes("quarter") && (
                        <option value="quarter">{L("meat.cuts.quarter", "Quarter")}</option>
                      )}
                      <option value="kilo">{L("meat.cuts.kilo", "Kilo")}</option>
                    </select>
                  </label>

                  {meatCut === "kilo" && (
                    <label>
                      {L("meat.kilos", "Kilos")}
                      <input type="number" min={1} value={meatKilos} onChange={(e) => setMeatKilos(Number(e.target.value))} style={{ width: "100%" }} />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div style={{ border: "1px dashed #bbb", padding: "12px" }}>
              <label>
                <input type="checkbox" checked={birdsEnabled} onChange={(e) => setBirdsEnabled(e.target.checked)} />{" "}
                {L("foodBlocks.birds", "Birds")}
              </label>

              {birdsEnabled && (
                <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
                  <label>
                    {L("birds.type", "Type")}
                    <input value={birdsType} onChange={(e) => setBirdsType(e.target.value)} style={{ width: "100%" }} />
                  </label>

                  <label>
                    {L("birds.qty", "Quantity")}
                    <input type="number" min={1} value={birdsQty} onChange={(e) => setBirdsQty(Number(e.target.value))} style={{ width: "100%" }} />
                  </label>

                  <label>
                    {L("birds.cook", "Cook")}
                    <input value={birdsCook} onChange={(e) => setBirdsCook(e.target.value)} style={{ width: "100%" }} />
                  </label>
                </div>
              )}
            </div>

            <div style={{ border: "1px dashed #bbb", padding: "12px" }}>
              <label>
                <input type="checkbox" checked={fishEnabled} onChange={(e) => setFishEnabled(e.target.checked)} />{" "}
                {L("foodBlocks.fish", "Fish")}
              </label>

              {fishEnabled && (
                <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
                  <label>
                    {L("fish.type", "Type")}
                    <input value={fishType} onChange={(e) => setFishType(e.target.value)} style={{ width: "100%" }} />
                  </label>

                  <label>
                    {L("fish.kilos", "Kilos")}
                    <input type="number" min={1} value={fishKilos} onChange={(e) => setFishKilos(Number(e.target.value))} style={{ width: "100%" }} />
                  </label>

                  <label>
                    {L("fish.cook", "Cook")}
                    <input value={fishCook} onChange={(e) => setFishCook(e.target.value)} style={{ width: "100%" }} />
                  </label>
                </div>
              )}
            </div>

            <div style={{ border: "1px dashed #bbb", padding: "12px" }}>
              <small style={{ color: "#555" }}>{L("foodBlocks.noMeatNote", "")}</small>
            </div>
          </div>
        </div>
      )}

      <div style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px" }}>
        <strong>{L("sections.equipment", "Equipment")}</strong>

        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <label>
            {L("equipmentFields.tent", "Tent")}
            <select value={tent} onChange={(e) => setTent(e.target.value as any)}>
              <option value="none">{L("tents.none", "None")}</option>
              <option value="one">{L("tents.one", "One")}</option>
              <option value="two">{L("tents.two", "Two")}</option>
              <option value="majlis">{L("tents.majlis", "Majlis")}</option>
            </select>
          </label>

          {tent !== "none" && (
            <label>
              {L("equipmentFields.tentSize", "Size")}
              <input
                type="text"
                placeholder={L("equipmentFields.tentSizePlaceholder", "")}
                value={tentSize}
                onChange={(e) => setTentSize(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
          )}

          <label>
            <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} /> {L("equipmentFields.tv", "TV")}
          </label>

          <label>
            <input type="checkbox" checked={portableToilet} onChange={(e) => setPortableToilet(e.target.checked)} />{" "}
            {L("equipmentFields.toilet", "Toilet")}
          </label>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px" }}>
        <strong>{L("sections.fun", "Fun")}</strong>

        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <label>
            <input type="checkbox" checked={kidsGames} onChange={(e) => setKidsGames(e.target.checked)} />{" "}
            {L("funFields.kidsGames", "Kids games")}
          </label>

          <label>
            <input type="checkbox" checked={quads} onChange={(e) => setQuads(e.target.checked)} /> {L("funFields.quads", "Quads")}
          </label>

          <label>
            <input type="checkbox" checked={youthGames} onChange={(e) => setYouthGames(e.target.checked)} />{" "}
            {L("funFields.youthGames", "Youth games")}
          </label>

          <label>
            <input type="checkbox" checked={baloot} onChange={(e) => setBaloot(e.target.checked)} /> {L("funFields.baloot", "Baloot")}
          </label>

          <label>
            <input type="checkbox" checked={hind} onChange={(e) => setHind(e.target.checked)} /> {L("funFields.hind", "Hind")}
          </label>
        </div>
      </div>

      {safetyShouldShow && (
        <div style={{ border: "1px solid #b00020", padding: "16px", marginBottom: "12px" }}>
          <strong>{L("sections.safety", "Safety")}</strong>
          <p style={{ marginTop: "8px", color: "#333", lineHeight: "1.8" }}>
            {L("safetyText", "")}
          </p>
        </div>
      )}

      <button onClick={submitFake} style={{ width: "100%", marginTop: "8px" }}>
        {L("submit", "Submit")}
      </button>

      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        {L("footerNote", "")}
      </div>
    </section>
  );
}
