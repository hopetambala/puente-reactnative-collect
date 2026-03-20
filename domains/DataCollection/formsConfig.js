import MedEvalSVG from "@assets/icons/Heart-Icon.svg";
import EnvSVG from "@assets/icons/Home-icon.svg";
import NewRecordSVG from "@assets/icons/New-Record-icon.svg";

export const puenteForms = [
  {
    tag: "id",
    name: "puenteForms.ResidentID",
    customForm: false,
    image: NewRecordSVG,
  },
  {
    tag: "env",
    name: "puenteForms.EnvironmentalHealth",
    customForm: false,
    image: EnvSVG,
  },
  {
    tag: "med-eval",
    name: "puenteForms.MedicalEvaluation",
    customForm: false,
    image: MedEvalSVG,
  },
  {
    tag: "vitals",
    name: "puenteForms.Vitals",
    customForm: false,
    image: NewRecordSVG,
  },
];

export default puenteForms;
