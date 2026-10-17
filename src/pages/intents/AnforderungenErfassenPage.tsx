/**
 * Anforderungen erfassen — 4-Schritt-Wizard.
 * Steps: 1) Anfrage wählen → 2) Anforderung mit Sollwert, Einheit und Ursprung erfassen → 3) Quellen zuordnen → 4) Prüfen & Anfrage in Prüfung setzen.
 * Reads: kundenanfragen, informationsquellen. Writes: technische_anforderungen (Prüfstatus ungeprüft), kundenanfragen (Status in Prüfung).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
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
import { useAnforderungenErfassenFlow } from '@/lib/journey/flows/AnforderungenErfassen';
import { tx } from '@/i18n';

export default function AnforderungenErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnforderungenErfassenFlow({
    steps: {
      kundenanfragen: 1, anfrage: 1,
      bezeichnung: 2, beschreibung: 2, anforderungstyp: 2, ursprung: 2, sollwert: 2, einheit: 2,
      vergleichsoperator: 2, min_wert: 2, max_wert: 2, ist_pflichtanforderung: 2,
      quellen: 3,
    },
    items: {
      kundenanfragen: r => ({
        id: r.id,
        title: fieldText(r, 'anfragenummer'),
        subtitle: fieldText(r, 'produktfamilie'),
        status: fieldLookup(r, 'status') ?? undefined,
      }),
      quellen: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldLookup(r, 'quellentyp')?.label,
        status: fieldLookup(r, 'quellenstatus') ?? undefined,
      }),
    },
  });

  const anfragePick = flow.pick('kundenanfragen');
  const anforderung = flow.forms.technische_anforderungen;
  const anforderungPick = flow.pick('anfrage');

  return (
    <IntentWizardShell
      title={tx('Anforderungen erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Technische Anforderungen zu einer Anfrage anlegen und Quellen zuordnen.'),
        needs: [tx('Anfragenummer'), tx('Sollwert und Einheit'), tx('Passende Informationsquellen')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Zu welcher Anfrage erfasst du Anforderungen?')}>
        <EntitySelectStep
          {...flow.picks.kundenanfragen.select}
          {...anfragePick}
          searchPlaceholder={tx('Anfragenummer suchen …')}
          onSelect={id => {
            anfragePick.onSelect(id);
            anforderungPick.onSelect(id);
          }}
        />
      </WizardStep>

      <WizardStep
        label={tx('Anforderung')}
        description={tx('Was soll erfüllt sein — mit Sollwert, Einheit und Ursprung?')}
        needs={['kundenanfragen']}
      >
        <div className="space-y-4">
          <Bound form={anforderung} name="bezeichnung" />
          <Bound form={anforderung} name="beschreibung" rows={3} />
          <Bound form={anforderung} name="anforderungstyp" />
          <Bound form={anforderung} name="ursprung" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Bound form={anforderung} name="sollwert" />
            <Bound form={anforderung} name="einheit" />
          </div>
          <Bound form={anforderung} name="vergleichsoperator" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Bound form={anforderung} name="min_wert" />
            <Bound form={anforderung} name="max_wert" />
          </div>
          <Bound form={anforderung} name="ist_pflichtanforderung" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Quellen')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Quellen')}
        description={tx('Woher stammt die Anforderung? Wähle eine oder mehrere Quellen.')}
        needs={['kundenanfragen']}
      >
        <div className="space-y-4">
          <Field form={anforderung} name="quellen">
            <EntitySelectStep {...flow.picks.quellen.select} {...flow.pickMany('quellen')} />
          </Field>
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')} description={tx('Anforderung anlegen und die Anfrage in Prüfung setzen.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'pruefstatus', label: tx('Prüfstatus der Anforderung'), value: tx('Ungeprüft') },
              { key: 'anfragestatus', label: tx('Status der Anfrage'), value: tx('In Prüfung') },
            ]}
            whatHappensNext={tx('Die Anforderung wird angelegt, die Anfrage geht in Prüfung.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Offenen Punkt anlegen'), href: '#/intents/offenen-punkt-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
