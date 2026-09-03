import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createSpectacle, getLatestConsultationForPatient } from "../spectacle.api";
import { getInventory } from "../../inventory/inventory.api";
import { DocumentShell, Section, Field, InfoGrid } from "../../../components/common/DocumentUI";

const eye = () => ({ sphere:"", cylinder:"", axis:"", va:"", add:"", inter:"", prism:"", base:"" });
const money = v => Number(v || 0).toFixed(2);

export default function NewSpectaclePage() {
  const { patientId } = useParams();
  const nav = useNavigate();
  const [error,setError] = useState("");
  const [frames,setFrames] = useState([]);
  const [lenses,setLenses] = useState([]);
  const [frameSearch,setFrameSearch] = useState("");
  const [lensSearch,setLensSearch] = useState("");
  const [form,setForm] = useState({
    jobDate:new Date().toISOString().slice(0,10), dueDate:"",
    rx:{right:eye(),left:eye(),note:""}, pd:{right:"",left:"",total:""},
    frame:{code:"",description:"",price:0,ownFrame:false}, frameItemId:null,
    lens:{code:"",description:"",supplier:"",price:0}, lensItemId:null,
    extras:[], discount:0, notes:""
  });

  useEffect(() => {
    getLatestConsultationForPatient(patientId).then(r=>{
      if(r?.data) setForm(f=>({...f,rx:r.data.givenRx||f.rx,pd:r.data.pd||f.pd,consultationId:r.data._id}));
    }).catch(e=>setError(e?.response?.data?.message||"Unable to load latest consultation"));
    Promise.all([getInventory({category:"frame"}),getInventory({category:"lens"})]).then(([f,l])=>{
      setFrames(f?.data||[]);setLenses(l?.data||[]);
    }).catch(e=>setError(e?.response?.data?.message||"Unable to load optical catalogue"));
  },[patientId]);

  const filteredFrames=useMemo(()=>frames.filter(x=>`${x.code} ${x.brand} ${x.model} ${x.description}`.toLowerCase().includes(frameSearch.toLowerCase())).slice(0,12),[frames,frameSearch]);
  const filteredLenses=useMemo(()=>lenses.filter(x=>`${x.code} ${x.brand} ${x.model} ${x.description} ${x.supplier}`.toLowerCase().includes(lensSearch.toLowerCase())).slice(0,12),[lenses,lensSearch]);
  const total=Number(form.frame.price||0)+Number(form.lens.price||0)+form.extras.reduce((a,x)=>a+Number(x.price||0),0)-Number(form.discount||0);
  const updateRx=(e,k,v)=>setForm(f=>({...f,rx:{...f.rx,[e]:{...f.rx[e],[k]:v}}}));
  const selectFrame=x=>{setForm(f=>({...f,frameItemId:x._id,frame:{code:x.code,description:x.description||[x.brand,x.model].filter(Boolean).join(" "),price:x.sellingPrice,ownFrame:false}}));setFrameSearch(`${x.code} ${x.brand||""}`.trim());};
  const selectLens=x=>{setForm(f=>({...f,lensItemId:x._id,lens:{code:x.code,description:x.description,supplier:x.supplier,price:x.sellingPrice}}));setLensSearch(`${x.code} ${x.description||""}`.trim());};
  const save=async()=>{try{const r=await createSpectacle({...form,patientId});nav(r?.data?`/optical/spectacles/${r.data._id}`:`/patients/${patientId}`)}catch(e){setError(e?.response?.data?.message||"Unable to create spectacle")}};

  return <DocumentShell eyebrow="Optical" title="New Spectacle Job" subtitle="Prescription, inventory selection, pricing and dispensing preparation in one document." code="NEW SPECTACLE" actions={<><button onClick={()=>nav(`/patients/${patientId}`)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"><ArrowLeft size={14} className="mr-1 inline"/>Back</button><button onClick={save} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"><Save size={14} className="mr-1 inline"/>Create job</button></>}>
    {error&&<div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <Section number="01" title="Job details"><div className="grid gap-4 sm:grid-cols-2"><Field label="Job date" type="date" value={form.jobDate} onChange={v=>setForm({...form,jobDate:v})}/><Field label="Due date" type="date" value={form.dueDate} onChange={v=>setForm({...form,dueDate:v})}/></div></Section>
    <Section number="02" title="Prescription"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b border-slate-200 text-[10px] uppercase text-slate-400"><th className="py-2 text-left">Eye</th>{Object.keys(eye()).map(k=><th key={k} className="py-2 text-left">{k}</th>)}</tr></thead><tbody>{["right","left"].map(e=><tr key={e} className="border-b border-slate-100"><td className="py-2 font-semibold">{e==="right"?"OD":"OS"}</td>{Object.keys(eye()).map(k=><td key={k} className="py-2 pr-2"><input value={form.rx[e]?.[k]||""} onChange={x=>updateRx(e,k,x.target.value)} className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-xs"/></td>)}</tr>)}</tbody></table></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Right PD" value={form.pd.right} onChange={v=>setForm({...form,pd:{...form.pd,right:v}})}/><Field label="Left PD" value={form.pd.left} onChange={v=>setForm({...form,pd:{...form.pd,left:v}})}/><Field label="Total PD" value={form.pd.total} onChange={v=>setForm({...form,pd:{...form.pd,total:v}})}/></div></Section>
    <Section number="03" title="Frame from inventory"><div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input value={frameSearch} onChange={e=>setFrameSearch(e.target.value)} placeholder="Search frame code, brand, model..." className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm"/>{frameSearch&&<div className="mt-2 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">{filteredFrames.map(x=><button type="button" key={x._id} onClick={()=>selectFrame(x)} className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"><b>{x.code}</b><span className="ml-3 text-slate-500">{[x.brand,x.model,x.description].filter(Boolean).join(" · ")}</span><span className="float-right font-semibold">₹{money(x.sellingPrice)} · Stock {x.stock}</span></button>)}</div>}</div><div className="mt-4"><InfoGrid items={[{label:"Selected code",value:form.frame.code},{label:"Description",value:form.frame.description},{label:"Price",value:`₹${money(form.frame.price)}`},{label:"Source",value:form.frameItemId?"Inventory":"Manual"}]}/></div></Section>
    <Section number="04" title="Lens from inventory"><div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input value={lensSearch} onChange={e=>setLensSearch(e.target.value)} placeholder="Search lens code, description, supplier..." className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm"/>{lensSearch&&<div className="mt-2 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">{filteredLenses.map(x=><button type="button" key={x._id} onClick={()=>selectLens(x)} className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"><b>{x.code}</b><span className="ml-3 text-slate-500">{x.description}</span><span className="ml-3 text-slate-400">{x.supplier||""}</span><span className="float-right font-semibold">₹{money(x.sellingPrice)} · Stock {x.stock}</span></button>)}</div>}</div><div className="mt-4"><InfoGrid items={[{label:"Selected code",value:form.lens.code},{label:"Description",value:form.lens.description},{label:"Supplier",value:form.lens.supplier},{label:"Price",value:`₹${money(form.lens.price)}`},{label:"Source",value:form.lensItemId?"Inventory":"Manual"}]}/></div></Section>
    <Section number="05" title="Extras & pricing"><div className="grid gap-4 sm:grid-cols-2"><Field label="Discount" type="number" value={form.discount} onChange={v=>setForm({...form,discount:Number(v)})}/></div><div className="mt-4"><button type="button" onClick={()=>setForm(f=>({...f,extras:[...f.extras,{description:"",supplier:"",price:0}]}))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">+ Add extra</button>{form.extras.map((x,i)=><div key={i} className="mt-3 grid gap-3 sm:grid-cols-3"><Field label={`Extra ${i+1}`} value={x.description} onChange={v=>setForm(f=>({...f,extras:f.extras.map((a,j)=>j===i?{...a,description:v}:a)}))}/><Field label="Supplier" value={x.supplier} onChange={v=>setForm(f=>({...f,extras:f.extras.map((a,j)=>j===i?{...a,supplier:v}:a)}))}/><Field label="Price" type="number" value={x.price} onChange={v=>setForm(f=>({...f,extras:f.extras.map((a,j)=>j===i?{...a,price:Number(v)}:a)}))}/></div>)}</div><div className="mt-5"><InfoGrid items={[{label:"Frame",value:`₹${money(form.frame.price)}`},{label:"Lens",value:`₹${money(form.lens.price)}`},{label:"Extras",value:`₹${money(form.extras.reduce((a,x)=>a+Number(x.price||0),0))}`},{label:"Discount",value:`₹${money(form.discount)}`},{label:"Total",value:`₹${money(total)}`}]}/></div></Section>
    <Section number="06" title="Notes"><Field label="Job notes" type="textarea" value={form.notes} onChange={v=>setForm({...form,notes:v})}/></Section>
  </DocumentShell>;
}
