const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');

const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(inputDir)) {
  throw Error('Input directory (input/) does not exist');
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.readdirSync(inputDir).map(fileName => {
  console.log('Processing ' + fileName);
  process(fileName);
});

function process(file) {
  let rawData = fs.readFileSync(path.join(__dirname, 'input', file));
  let bundle = JSON.parse(rawData);
  const newEntries = [];
  bundle.entry.forEach(entry => {
    if (entry.resource.resourceType === 'Observation' && entry.resource.code.coding[0].code === '55284-4') {
      const systolic = getComponentValue(entry.resource.component, '8480-6');
      const patientId = getPatientId(entry.resource);
      const encounterId = getEncounterId(entry.resource);
      const timestamp = getTimestamp(entry.resource);
      const pulse = generatePulseValue(systolic);
      //console.log('Systolic: ' + systolic + ', Pulse: ' + pulse);
      newEntries.push(entry);
      newEntries.push(generatePulseObservation(pulse, patientId, encounterId, timestamp));
    } else {
      newEntries.push(entry);
    }
  });
  bundle.entry = newEntries;
  rawData = JSON.stringify(bundle, null, '  ');
  rawData = rawData.replace(/http\:\/\/hl7\.org\/fhir\/us\/core\/StructureDefinition\/us\-core\-race/g, 'https://www.hl7.org/fhir/us/core/StructureDefinition-us-core-race.html');
  rawData = rawData.replace(/http\:\/\/hl7\.org\/fhir\/us\/core\/StructureDefinition\/us\-core\-ethnicity/g, 'https://www.hl7.org/fhir/us/core/StructureDefinition-us-core-ethnicity.html');
  rawData = rawData.replace(/http\:\/\/hl7\.org\/fhir\/us\/core\/StructureDefinition\/us\-core\-birthsex/g, 'https://www.hl7.org/fhir/us/core/StructureDefinition-us-core-birthsex.html');
  rawData = rawData.replace(/http\:\/\/synthetichealth\.github\.io\/synthea\/disability\-adjusted\-life\-years/g, 'https://synthea.mitre.org/synthea/disability-adjusted-life-years');
  rawData = rawData.replace(/http\:\/\/synthetichealth\.github\.io\/synthea\/quality\-adjusted\-life\-years/g, 'https://synthea.mitre.org/synthea/quality-adjusted-life-years');
  fs.writeFileSync(path.join(__dirname, 'output', file), rawData);
}

function getComponentValue(components, coding) {
  let val = 0;
  components.some(component => {
    if (component.code.coding[0].code === coding) {
      val = component.valueQuantity.value;
      return true;
    }
    return false;
  });
  return val;
}

function getPatientId(observation) {
  return observation.subject.reference.substring(9);
}

function getEncounterId(observation) {
  return observation.context.reference.substring(9);
}

function getTimestamp(observation) {
  return observation.effectiveDateTime;
}

function generatePulseValue(systolicValue) {
  let baseValue = 75;
  if (systolicValue <= 120) {
    baseValue -= 5;
  } else if (systolicValue > 140 && systolicValue <= 160) {
    baseValue += 10;
  } else if (systolicValue > 160) {
    baseValue += 20;
  }
  let adj = Math.round((Math.random()*20)-10);
  return baseValue += adj;
}

function generatePulseObservation(pulseValue, patientId, encounterId, timestamp) {
  const id = uuidv1();
  let obs = {
   "fullUrl":id,
   "resource":{
      "resourceType":"Observation",
      "id":id,
      "status":"final",
      "category":[
         {
            "coding":[
               {
                  "system":"http://hl7.org/fhir/observation-category",
                  "code":"vital-signs",
                  "display":"vital-signs"
               }
            ]
         }
      ],
      "code":{
         "coding":[
            {
               "system":"http://loinc.org",
               "code":"8867-4",
               "display":"Heart rate"
            }
         ],
         "text":"Heart rate"
      },
      "subject":{
         "reference":"urn:uuid:" + patientId
      },
      "context":{
         "reference":"urn:uuid:" + encounterId
      },
      "effectiveDateTime":timestamp,
      "issued":timestamp,
      "valueQuantity":{
         "value": pulseValue,
         "unit":"beats/minute",
         "system":"http://unitsofmeasure.org",
         "code":"/min"
      }
   },
   "request":{
      "method":"POST",
      "url":"Observation"
   }
 };
 //console.log(JSON.stringify(obs));
 return obs;
}
