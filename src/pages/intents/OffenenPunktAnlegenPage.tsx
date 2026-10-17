/**
 * Offenen Punkt anlegen — 5-Schritt-Wizard.
 * Steps: 1) Anfrage wählen → 2) Punkt beschreiben → 3) Betroffene Anforderungen und Quellen → 4) Aufgabe mit Verantwortlichem → 5) Prüfen & anlegen.
 * Reads: kundenanfragen, technische_anforderungen, informationsquellen. Writes: offene_punkte, aufgaben (via useOffenenPunktAnlegenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
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
import { useOffenenPunktAnlegenFlow } from '@/lib/journey/flows/OffenenPunktAnlegen';
import { tx } from '@/i18n';

export default function OffenenPunktAnlegenPage() {
  const [step, setStep] = useState(1);
  const flow = useOffenenPunktAnlegenFlow({
    steps: {
      anfrage: 1,
      kurztitel: 2, beschreibung: 2, punktetyp: 2, prioritaet: 2, auswirkung: 2, zustaendige_rolle: 2,
      verantwortlicher_vorname: 2, verantwortlicher_nachname: 2, faellig_am: 2, erledigungskriterium: 2,
      betroffene_anforderungen: 3, betroffene_quellen: 3,
      titel: 4, aufgabentyp: 4,
    },
    items: {
      anfrage: r => ({ id: r.id, title: fieldText(r, 'anfragenummer'), subtitle: fieldText(r, 'kundenreferenz') }),
      betroffene_anforderungen: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        status: fieldLookup(r, 'pruefstatus') ?? undefined,
      }),
      betroffene_quellen: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        status: fieldLookup(r, 'quellenstatus') ?? undefined,
      }),
    },
  });
  const punkt = flow.forms.offene_punkte;
  const aufgabe = flow.forms.aufgaben;

  return (
    <IntentWizardShell
      title={tx('Offenen Punkt anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Klärungsbedarf festhalten und gleich eine verantwortete Aufgabe dazu anlegen.'),
        needs: [tx('Die betroffene Anfrage'), tx('Grund und Priorität des Punkts'), tx('Wer sich kümmert')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Zu welcher Anfrage gehört der offene Punkt?')}>
        <EntitySelectStep
          {...flow.picks.anfrage.select}
          {...flow.pick('anfrage')}
          onSelect={id => {
            const label = flow.picks.anfrage.labelOf(id);
            punkt.set('anfrage', id, label);
            aufgabe.set('anfrage', id, label);
          }}
          searchPlaceholder={tx('Anfragenummer suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Punkt')} description={tx('Beschreibe, was unklar ist und warum es wichtig ist.')} needs={['anfrage']}>
        <div className="space-y-4">
          <Bound form={punkt} name="kurztitel" />
          <Bound form={punkt} name="beschreibung" rows={4} />
          <Bound form={punkt} name="punktetyp" />
          <Bound form={punkt} name="prioritaet" />
          <Bound form={punkt} name="auswirkung" />
          <Bound form={punkt} name="zustaendige_rolle" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Bound form={punkt} name="verantwortlicher_vorname" />
            <Bound form={punkt} name="verantwortlicher_nachname" />
          </div>
          <Bound form={punkt} name="faellig_am" />
          <Bound form={punkt} name="erledigungskriterium" rows={3} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() =>
              punkt.validate([
                'kurztitel', 'beschreibung', 'punktetyp', 'prioritaet', 'auswirkung', 'zustaendige_rolle',
                'verantwortlicher_vorname', 'verantwortlicher_nachname', 'faellig_am', 'erledigungskriterium',
              ])
            }
            nextStepLabel={tx('Betroffenes')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Betroffenes')}
        description={tx('Welche Anforderungen und Quellen hängen an diesem Punkt?')}
        needs={['anfrage']}
      >
        <div className="space-y-6">
          <Field form={punkt} name="betroffene_anforderungen">
            <EntitySelectStep
              {...flow.picks.betroffene_anforderungen.select}
              {...flow.pickMany('betroffene_anforderungen')}
              searchPlaceholder={tx('Anforderung suchen …')}
            />
          </Field>
          <Field form={punkt} name="betroffene_quellen">
            <EntitySelectStep
              {...flow.picks.betroffene_quellen.select}
              {...flow.pickMany('betroffene_quellen')}
              searchPlaceholder={tx('Quelle suchen …')}
            />
          </Field>
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => punkt.validate(['betroffene_anforderungen', 'betroffene_quellen'])}
            nextStepLabel={tx('Aufgabe')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Aufgabe')}
        description={tx('Wer kümmert sich darum, und bis wann?')}
        needs={['anfrage']}
      >
        <div className="space-y-4">
          <Bound form={aufgabe} name="titel" />
          <Bound form={aufgabe} name="beschreibung" rows={3} />
          <Bound form={aufgabe} name="aufgabentyp" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Bound form={aufgabe} name="verantwortlicher_vorname" />
            <Bound form={aufgabe} name="verantwortlicher_nachname" />
          </div>
          <Bound form={aufgabe} name="prioritaet" />
          <Bound form={aufgabe} name="faellig_am" />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() =>
              aufgabe.validate([
                'titel', 'beschreibung', 'aufgabentyp', 'verantwortlicher_vorname',
                'verantwortlicher_nachname', 'prioritaet', 'faellig_am',
              ])
            }
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Der Punkt startet als „zugewiesen“, die Aufgabe als „offen“ und ist mit dem Punkt verknüpft.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Rückfrage vorbereiten'), href: '#/intents/rueckfrage-vorbereiten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
