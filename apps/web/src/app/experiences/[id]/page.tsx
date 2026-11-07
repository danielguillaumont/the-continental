"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowUpRight, BriefcaseBusiness, FolderKanban, LibraryBig, Link2, MapPin, Pencil, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

import { ExperienceForm } from "@/components/experiences/experience-form";
import { AppShell } from "@/components/shell/app-shell";
import { attachExperienceEvidence, attachExperienceProject, deleteExperience, detachExperienceEvidence, detachExperienceProject, getExperience, listEvidence, listProjects } from "@/lib/api";
import { employmentLabels, experiencePeriod, experienceProofCount } from "@/lib/experience-workspace";
import { projectDetailsUrl } from "@/lib/project-workspace";
import type { EvidenceRecord } from "@/types/evidence";
import type { ExperienceRecord } from "@/types/experience";
import type { ProjectRecord } from "@/types/project";

const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-[12px] font-semibold text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-4 text-[12px] font-semibold text-text-inverse hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50";
const selectClass = "min-h-11 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none focus-visible:border-gold disabled:opacity-50";

export default function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<ExperienceRecord | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getExperience(id), listProjects(), listEvidence()])
      .then(([experienceRecord, projectRecords, evidenceRecords]) => {
        if (!active) return;
        setRecord(experienceRecord);
        setProjects(projectRecords);
        setEvidence(evidenceRecords);
        setLoadError(null);
      })
      .catch((cause: unknown) => { if (active) setLoadError(cause instanceof Error ? cause.message : "Could not load this experience."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function refresh() {
    setBusy(true); setActionError(null);
    try {
      const [experienceRecord, projectRecords, evidenceRecords] = await Promise.all([getExperience(id), listProjects(), listEvidence()]);
      setRecord(experienceRecord); setProjects(projectRecords); setEvidence(evidenceRecords); setLoadError(null);
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not refresh this experience."); }
    finally { setBusy(false); }
  }

  async function linkProject() {
    if (!record || !selectedProject || busy) return;
    setBusy(true); setActionError(null); setNotice(null);
    try {
      setRecord(await attachExperienceProject(record.id, selectedProject));
      setSelectedProject(""); setNotice("Project connected. It remains an independent record.");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not connect project."); }
    finally { setBusy(false); }
  }

  async function unlinkProject(projectId: string) {
    if (!record || busy) return;
    setBusy(true); setActionError(null); setNotice(null);
    try { setRecord(await detachExperienceProject(record.id, projectId)); setNotice("Project link removed. The project was not deleted."); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not remove project link."); }
    finally { setBusy(false); }
  }

  async function linkEvidence() {
    if (!record || !selectedEvidence || busy) return;
    setBusy(true); setActionError(null); setNotice(null);
    try {
      setRecord(await attachExperienceEvidence(record.id, selectedEvidence));
      setSelectedEvidence(""); setNotice("Evidence connected. The original record remains in your Evidence library.");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not connect evidence."); }
    finally { setBusy(false); }
  }

  async function unlinkEvidence(evidenceId: string) {
    if (!record || busy) return;
    setBusy(true); setActionError(null); setNotice(null);
    try { setRecord(await detachExperienceEvidence(record.id, evidenceId)); setNotice("Evidence link removed. The evidence was not deleted."); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not remove evidence link."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!record || busy) return;
    setBusy(true); setActionError(null);
    try { await deleteExperience(record.id); router.replace("/experiences"); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not delete experience."); setBusy(false); }
  }

  const linkedProjectIds = new Set(record?.projects.map((project) => project.id) ?? []);
  const availableProjects = projects.filter((project) => !linkedProjectIds.has(project.id));
  const linkedEvidenceIds = new Set(record?.evidence.map((item) => item.id) ?? []);
  const availableEvidence = evidence.filter((item) => !linkedEvidenceIds.has(item.id));

  return (
    <AppShell sectionLabel="Experience">
      <div className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link href="/experiences" className="inline-flex min-h-10 items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-gold"><ArrowLeft className="size-4" aria-hidden="true" />All experience</Link>
        {loading ? <div role="status" className="mt-7 rounded-xl border border-border bg-surface p-7 text-[14px] text-text-secondary">Loading experience workspace…</div>
          : loadError || !record ? <div role="alert" className="mt-7 rounded-xl border border-danger-border bg-danger-surface p-6"><p className="flex items-center gap-2 text-[15px] font-semibold text-danger-text"><AlertCircle className="size-5" aria-hidden="true" />Experience unavailable</p><p className="mt-2 text-[13px] text-text-secondary">{loadError ?? "This experience could not be found."}</p><Link href="/experiences" className="mt-4 inline-flex text-[13px] font-semibold text-gold hover:underline">Return to Experience</Link></div>
            : <>
              <header className="mt-4 flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
                <div className="min-w-0 max-w-[760px] flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Experience / Role workspace</p>
                  <h1 className="mt-3 break-words text-[28px] font-semibold leading-tight tracking-tight text-text-primary sm:text-[34px]">{record.title}</h1>
                  <p className="mt-2 break-words text-[17px] font-medium text-gold">{record.organization}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-text-secondary"><span>{experiencePeriod(record)}</span>{record.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden="true" />{record.location}</span>}{record.employmentType && <span className="rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-[11px] font-semibold">{employmentLabels[record.employmentType]}</span>}</div>
                </div>
                <button type="button" className={secondaryButton} disabled={busy} onClick={() => { setEditing(true); setNotice(null); }}><Pencil className="size-4" aria-hidden="true" />Edit experience</button>
              </header>

              {actionError && <p role="alert" className="mt-5 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text">{actionError}</p>}
              {notice && <p role="status" className="mt-5 rounded-lg border border-success-border bg-success-surface p-4 text-[13px] text-success-text">{notice}</p>}
              {editing && <div className="mt-6"><ExperienceForm key={record.id} experience={record} onCancel={() => setEditing(false)} onSaved={(updated) => { setRecord(updated); setEditing(false); setNotice("Experience details saved."); setActionError(null); }} /></div>}

              <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-6">
                  <section aria-labelledby="role-story" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">Role record</p>
                    <h2 id="role-story" className="mt-2 text-[20px] font-semibold text-text-primary">Responsibilities & impact</h2>
                    <p className="mt-4 whitespace-pre-wrap break-words text-[14px] leading-7 text-text-secondary">{record.description}</p>
                    <div className="mt-6 border-t border-border-subtle pt-5">
                      <h3 className="text-[15px] font-semibold text-text-primary">Key accomplishments</h3>
                      {record.highlights.length > 0 ? <ul className="mt-3 space-y-3">{record.highlights.map((item, index) => <li className="flex items-start gap-3 text-[13px] leading-6 text-text-secondary" key={`${index}-${item}`}><span aria-hidden="true" className="mt-0.5 font-technical text-[11px] text-gold">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 break-words">{item}</span></li>)}</ul> : <p className="mt-2 text-[13px] text-text-muted">No accomplishments added yet. Edit the role to include concrete outcomes.</p>}
                    </div>
                  </section>

                  <section aria-labelledby="related-projects" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">Related work</p><h2 id="related-projects" className="mt-2 text-[20px] font-semibold text-text-primary">Projects in this role</h2><p className="mt-1 text-[13px] text-text-secondary">Associate projects you built while in this role.</p></div><FolderKanban className="size-5 text-gold" aria-hidden="true" /></div>
                    {record.projects.length ? <ul className="mt-5 space-y-3">{record.projects.map((project) => <li key={project.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4"><div className="min-w-0 flex-1"><Link href={projectDetailsUrl(project.id)} className="inline-flex min-h-9 max-w-full items-center gap-2 break-words text-[13px] font-semibold text-text-primary hover:text-gold">{project.name}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /></Link><p className="text-[12px] text-text-muted">Project · {project.status}</p></div><button type="button" className={secondaryButton} disabled={busy} onClick={() => void unlinkProject(project.id)} aria-label={`Remove link to ${project.name}`}>Detach</button></li>)}</ul> : <p className="mt-5 rounded-lg border border-dashed border-border-strong bg-surface-raised p-5 text-center text-[13px] leading-6 text-text-secondary">No linked projects yet. The role can stand on its own, but a related project helps demonstrate your work.</p>}
                    <div className="mt-5 border-t border-border-subtle pt-5"><label className="block text-[12px] font-semibold text-text-secondary" htmlFor="experience-project-select">Choose an existing project</label><div className="mt-2 flex flex-col gap-3 sm:flex-row"><select id="experience-project-select" className={selectClass} disabled={busy || availableProjects.length === 0} value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}><option value="">{availableProjects.length ? "Select project…" : "No unlinked projects available"}</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button type="button" className={primaryButton} disabled={busy || !selectedProject} onClick={() => void linkProject()}><Link2 aria-hidden="true" className="size-4" />Link project</button></div><Link href="/armory/projects" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-gold hover:underline">Browse Projects <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div>
                  </section>

                  <section aria-labelledby="related-evidence" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">Supporting proof</p><h2 id="related-evidence" className="mt-2 text-[20px] font-semibold text-text-primary">Evidence for this role</h2><p className="mt-1 text-[13px] text-text-secondary">Link proof from the Evidence library without duplicating records.</p></div><LibraryBig className="size-5 text-gold" aria-hidden="true" /></div>
                    {record.evidence.length ? <ul className="mt-5 space-y-3">{record.evidence.map((item) => <li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4"><div className="min-w-0 flex-1"><Link href={`/armory/${item.id}`} className="inline-flex min-h-9 max-w-full items-center gap-2 break-words text-[13px] font-semibold text-text-primary hover:text-gold">{item.title}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></Link><p className="text-[12px] text-text-muted">{item.kind} · {item.status}</p></div><button type="button" className={secondaryButton} disabled={busy} onClick={() => void unlinkEvidence(item.id)} aria-label={`Remove link to ${item.title}`}>Detach</button></li>)}</ul> : <p className="mt-5 rounded-lg border border-dashed border-border-strong bg-surface-raised p-5 text-center text-[13px] leading-6 text-text-secondary">No evidence linked yet. Add a reusable record that backs up a responsibility or accomplishment.</p>}
                    <div className="mt-5 border-t border-border-subtle pt-5"><label className="block text-[12px] font-semibold text-text-secondary" htmlFor="experience-evidence-select">Choose saved evidence</label><div className="mt-2 flex flex-col gap-3 sm:flex-row"><select id="experience-evidence-select" className={selectClass} disabled={busy || availableEvidence.length === 0} value={selectedEvidence} onChange={(event) => setSelectedEvidence(event.target.value)}><option value="">{availableEvidence.length ? "Select evidence…" : "No unlinked evidence available"}</option>{availableEvidence.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button type="button" className={primaryButton} disabled={busy || !selectedEvidence} onClick={() => void linkEvidence()}><Link2 aria-hidden="true" className="size-4" />Link evidence</button></div><Link href="/armory" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-gold hover:underline">Browse Evidence <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div>
                  </section>
                </div>

                <aside className="min-w-0 space-y-4">
                  <section aria-label="Experience at a glance" className="rounded-xl border border-border bg-surface p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">At a glance</p><div className="mt-4 flex items-center gap-3"><BriefcaseBusiness className="size-5 text-gold" aria-hidden="true" /><div><p className="text-[22px] font-semibold text-text-primary">{experienceProofCount(record)}</p><p className="text-[12px] text-text-secondary">Supporting records</p></div></div><p className={`mt-4 rounded-md px-3 py-2 text-[12px] font-semibold ${experienceProofCount(record) > 0 ? "bg-success-surface text-success-text" : "bg-warning-surface text-warning-text"}`}>{experienceProofCount(record) > 0 ? "Related work connected" : "Awaiting supporting records"}</p></section>
                  <section aria-label="Experience next steps" className="rounded-xl border border-border bg-surface p-5"><h2 className="text-[15px] font-semibold text-text-primary">Next steps</h2><ol className="mt-4 space-y-3 text-[13px] leading-5 text-text-secondary"><li><span className="mr-2 font-technical text-gold">01</span>Record the role <span className="text-success-text">✓</span></li><li><span className="mr-2 font-technical text-gold">02</span>Add accomplishments {record.highlights.length ? <span className="text-success-text">✓</span> : <span className="text-warning-text">— next</span>}</li><li><span className="mr-2 font-technical text-gold">03</span>Connect projects or evidence {experienceProofCount(record) > 0 ? <span className="text-success-text">✓</span> : <span className="text-warning-text">— next</span>}</li></ol><button type="button" className={`mt-5 ${secondaryButton}`} disabled={busy} onClick={() => void refresh()}><RefreshCw aria-hidden="true" className="size-4" />Refresh</button></section>
                  <section aria-label="Experience management" className="rounded-xl border border-danger-border/60 bg-surface p-5"><h2 className="text-[14px] font-semibold text-text-primary">Experience management</h2><p className="mt-2 text-[12px] leading-5 text-text-secondary">Deleting this role removes only its relationships. Original projects and evidence remain saved.</p>{!confirmDelete ? <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 text-[12px] font-semibold text-danger-text hover:underline"><Trash2 className="size-4" aria-hidden="true" />Delete experience</button> : <div className="mt-4 rounded-md border border-danger-border bg-danger-surface p-3"><p className="text-[13px] font-semibold text-danger-text">Permanently delete this experience?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void remove()} className="min-h-10 rounded-md bg-danger px-3 text-[12px] font-semibold text-white disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className={secondaryButton}>Cancel</button></div></div>}</section>
                  <p className="flex items-start gap-2 text-[12px] leading-5 text-text-muted"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />Career claims are only as strong as the real records behind them.</p>
                </aside>
              </div>
            </>}
      </div>
    </AppShell>
  );
}
