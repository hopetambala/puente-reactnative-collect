import I18n from "@modules/i18n";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";

function Looper({
  data,
  config,
  additionalQuestions,
  translatedLabel,
  setAdditionalQuestions,
  loopsAdded,
  setLoopsAdded,
  sameForm,
}) {
  const { formikKey, numberQuestionsToRepeat } = data;

  const [individualLoopsAdded, setIndividualLoopsAdded] = useState(0);
  const [questionsToRepeat, setQuestionsToRepeat] = useState([]);
  const [numberedQestions, setNumberedQuestions] = useState({});

  useEffect(() => {
    numberQuestionsInConfig();
  }, []);

  useEffect(() => {
    updateQuestionsToRepeat();
  }, [numberedQestions]);

  // number all questions in config (for looping ccapabilities)
  const numberQuestionsInConfig = () => {
    const fieldsNumberedJson = {};
    config.fields.forEach((field, index) => {
      fieldsNumberedJson[index] = field;
    });
    setNumberedQuestions(fieldsNumberedJson);
  };

  // update the questions that will be repeated if the field type is loop
  const updateQuestionsToRepeat = () => {
    Object.entries(numberedQestions).forEach(([key, value]) => {
      if (value.formikKey === formikKey) {
        let repeatQuestions = [];
        for (let i = key - numberQuestionsToRepeat; i < key; i += 1) {
          // ensure question does not excceed the first question
          if (i >= 0) {
            repeatQuestions = repeatQuestions.concat(numberedQestions[i]);
          }
        }
        setQuestionsToRepeat(repeatQuestions);
      }
    });
  };

  // add another loop of questions in correct position in form (additionalQuestions)
  // update number of loops added (+1)
  const addLoop = () => {
    // updated formikKey to ensure uniqueness
    let updatedQuestions = [];
    questionsToRepeat.forEach((question) => {
      const updatedQuestion = _.cloneDeep(question);
      if (sameForm !== true) {
        updatedQuestion.formikKey = `${updatedQuestion.formikKey}__loop${individualLoopsAdded}`;
      } else {
        updatedQuestion.formikKey = `${updatedQuestion.formikKey}__sameForm${individualLoopsAdded}`;
      }
      if (updatedQuestion.options) {
        updatedQuestion.options = updateTextKeys(updatedQuestion.options);
      }
      updatedQuestions = updatedQuestions.concat(updatedQuestion);
    });

    setAdditionalQuestions(additionalQuestions.concat(updatedQuestions));
    if (sameForm !== true) {
      setLoopsAdded(loopsAdded + 1);
    }
    setIndividualLoopsAdded(individualLoopsAdded + 1);
  };

  const updateTextKeys = (options) => {
    let updatedOptions = [];
    options.forEach((option) => {
      const updatedOption = _.cloneDeep(option);
      const textKeys = updatedOption.textKey.split("__");
      updatedOption.textKey = sameForm
        ? `__${textKeys[1]}__sameForm${individualLoopsAdded}__${textKeys[2]}`
        : `__${textKeys[1]}__loop${individualLoopsAdded}__${textKeys[2]}`;
      updatedOptions = updatedOptions.concat(updatedOption);
    });
    return updatedOptions;
  };

  const removeLoop = () => {
    if (sameForm !== true) {
      setLoopsAdded(loopsAdded - 1);
    }
    setIndividualLoopsAdded(individualLoopsAdded - 1);
    setAdditionalQuestions(
      additionalQuestions.slice(
        0,
        additionalQuestions.length - numberQuestionsToRepeat
      )
    );
  };

  return (
    <View>
      <Button onPress={() => addLoop()}>
        {I18n.t("paperButton.addAdditional")}
        {translatedLabel}
      </Button>
      {individualLoopsAdded !== 0 && (
        <Button onPress={() => removeLoop()}>
          {I18n.t("paperButton.removePrevious")}
          {translatedLabel}
        </Button>
      )}
    </View>
  );
}

export default Looper;
