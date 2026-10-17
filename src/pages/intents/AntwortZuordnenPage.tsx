/**
 * Antwort zuordnen — 7-Schritt-Wizard.
 * Steps: 1) Offenen Punkt wählen → 2) Anfrage wählen → 3) Ursprüngliche Nachricht wählen → 4) Weitere offene Punkte zuordnen
 *        → 5) Quelle wählen → 6) Antwort erfassen & Status festlegen → 7) Prüfen & anlegen.
 * Reads: offene_punkte, kundenanfragen, rueckfragen_und_kommunikation, informationsquellen.
 * Writes: rueckfragen_und_kommunikation (create), offene_punkte (update: in Bearbeitung + erneute Prüfung, nie erledigt).
 * Composes: IntentWizardShell, EntitySelectStep, Field, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useAntwortZuordnenFlow } from '@/lib/journey/flows/AntwortZuordnen';
import { tx } from '@/i18n';

export default function AntwortZuordnenPage() {
  const [step, setStep] = useState(1);
  const flow = useAntwortZuordnenFlow({
    steps: {
      offene_punkte: 1, anfrage: 2, beantwortet_nachricht: 3, zugehoerige_offene_punkte: 4, quelle: 5,
      kanal: 6, absender: 6, betreff: 6, inhalt: 6, antwortstatus: 6, folgeaufgabe_noetig: 6,
    },
    items: {
      offene_punkte: r => ({
        id: r.id,
        title: fieldText(r, 'kurztitel'),
        subtitle: fieldLookup(r, 'status')?.label,
      }),
      anfrage: r => ({ id: r.id, title: fieldText(r, 'anfragenummer') }),
      beantwortet_nachricht: r => ({
        id: r.id,
        title: fieldText(r, 'betreff'),
        subtitle: fieldText(r, 'empfaenger'),
        status: fieldLookup(r, 'versandstatus') ?? undefined,
      }),
      zugehoerige_offene_punkte: r => ({
        id: r.id,
        title: fieldText(r, 'kurztitel'),
        subtitle: fieldLookup(r, 'status')?.label,
      }),
      quelle: r => ({ id: r.id, title: fieldText(r, 'titel') }),
    },
  });
  const kommunikation = flow.forms.rueckfragen_und_kommunikation;

  return (
    <IntentWizardShell
      title={tx('Antwort zuordnen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine eingegangene Antwort erfassen und dem offenen Punkt zuordnen.'),
        needs: [tx('Der offene Punkt, auf den geantwortet wurde'), tx('Text der Antwort')],
      }}
    >
      <WizardStep label={tx('Offener Punkt')} description={tx('Zu welchem offenen Punkt ist die Antwort eingegangen?')}>
        <EntitySelectStep {...flow.picks.offene_punkte.select} {...flow.pick('offene_punkte')}
          searchPlaceholder={tx('Kurztitel suchen …')} />
      </WizardStep>
      <WizardStep label={tx('Anfrage')} description={tx('Zu welcher Kundenanfrage gehört die Antwort?')}>
        <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')}
          searchPlaceholder={tx('Anfragenummer suchen …')} />
      </WizardStep>
      <WizardStep label={tx('Nachricht')} description={tx('Auf welche Nachricht antwortet das? Ohne Bezug einfach weiter.')}>
        <Field form={kommunikation} name="beantwortet_nachricht">
          <EntitySelectStep {...flow.picks.beantwortet_nachricht.select} {...flow.pick('beantwortet_nachricht')}
            searchPlaceholder={tx('Betreff suchen …')}
            emptyText={tx('Keine versendete Rückfrage wartet auf eine Antwort. Ohne Bezug geht es einfach weiter.')} />
        </Field>
        <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Offene Punkte')} />
      </WizardStep>
      <WizardStep label={tx('Weitere Punkte')} description={tx('Welche offenen Punkte beantwortet die Nachricht noch?')}>
        <Field form={kommunikation} name="zugehoerige_offene_punkte">
          <EntitySelectStep {...flow.picks.zugehoerige_offene_punkte.select}
            {...flow.pickMany('zugehoerige_offene_punkte')} />
        </Field>
        <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Quelle')} />
      </WizardStep>
      <WizardStep label={tx('Quelle')} description={tx('Welche Informationsquelle enthält die Antwort? Ohne Quelle einfach weiter.')}>
        <Field form={kommunikation} name="quelle">
          <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')}
            searchPlaceholder={tx('Titel suchen …')} />
        </Field>
        <StepNav onBack={() => setStep(4)} onNext={() => flow.validateStep(5)} nextStepLabel={tx('Antwort erfassen')} />
      </WizardStep>
      <WizardStep label={tx('Antwort')} description={tx('Antwort erfassen und als vollständig, unklar oder widersprüchlich kennzeichnen.')}>
        <div className="space-y-4">
          <Bound form={kommunikation} name="kanal" />
          <Bound form={kommunikation} name="absender" />
          <Bound form={kommunikation} name="betreff" />
          <Bound form={kommunikation} name="inhalt" rows={5} />
          <Bound form={kommunikation} name="antwortstatus" />
          <Bound form={kommunikation} name="folgeaufgabe_noetig" />
          <StepNav onBack={() => setStep(5)} onNext={() => flow.validateStep(6)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'op_status', label: tx('Status des offenen Punkts'), value: tx('In Bearbeitung') },
              { key: 'op_pruefung', label: tx('Erneute Prüfung'), value: tx('Erforderlich') },
            ]}
            whatHappensNext={tx('Der offene Punkt wird nicht erledigt, sondern zur fachlichen Prüfung der Antwort markiert.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Der Punkt gilt erst nach fachlicher Prüfung der Antwort als erledigt.')}
          next={[
            { label: tx('Offenen Punkt anlegen'), href: '#/intents/offenen-punkt-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
