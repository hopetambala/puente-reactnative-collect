import ComingSoonSVG from "@app/assets/graphics/static/Adventurer.svg";
import SmallCardsCarousel from "@impacto-design-system/Cards/SmallCardsCarousel";
import { getData, storeData } from "@modules/async-storage";
import { customFormsQuery } from "@modules/cached-resources";
import I18n from "@modules/i18n";
import { layout, theme } from "@modules/theme";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  Paragraph,
  Text,
  Title,
} from "react-native-paper";

import FormsHorizontalView from "./FormsHorizontalView";
import styles from "./index.styles";

function FormGallery({
  navigateToNewRecord,
  navigateToCustomForm,
  puenteForms,
  pinnedForms,
  setPinnedForms,
  setLoading,
  surveyingOrganization,
}) {
  const [customForms, setCustomForms] = useState([]);
  const [workflowData, setWorkflowData] = useState({});
  const [noWorkflowData, setNoWorkflowData] = useState([]);

  useEffect(() => {
    getData("customForms").then((forms) => {
      setCustomForms(forms || []);
      filterWorkflows(forms || []);
    });
  }, [customForms]);

  const filterWorkflows = (forms) => {
    const tableDataByCategory = {};
    forms.forEach((record) => {
      if (!Array.isArray(record.workflows) || record.workflows.length < 1) {
        if ("No Workflow Assigned" in tableDataByCategory) {
          tableDataByCategory["No Workflow Assigned"] = tableDataByCategory[
            "No Workflow Assigned"
          ].concat([record]);
        } else {
          tableDataByCategory["No Workflow Assigned"] = [record];
        }
      } else if (Array.isArray(record.workflows)) {
        record.workflows.forEach((workflow) => {
          if (workflow in tableDataByCategory) {
            tableDataByCategory[workflow] = tableDataByCategory[
              workflow
            ].concat([record]);
          } else {
            tableDataByCategory[workflow] = [record];
          }
        });
      }
    });
    setNoWorkflowData(tableDataByCategory["No Workflow Assigned"]);
    delete tableDataByCategory["No Workflow Assigned"];
    delete tableDataByCategory.Puente;
    setWorkflowData(tableDataByCategory);
  };

  const refreshCustomForms = () => {
    setLoading(true);
    customFormsQuery(surveyingOrganization).then((forms) => {
      setCustomForms(forms);
      setLoading(false);
    });
  };

  const pinForm = async (form) => {
    const newPinnedForms = [...pinnedForms, form];
    setPinnedForms(newPinnedForms);
    storeData(newPinnedForms, "pinnedForms");
  };

  const removePinnedForm = async (form) => {
    const filteredPinnedForms = pinnedForms.filter(
      (pinnedForm) => pinnedForm !== form
    );
    setPinnedForms(filteredPinnedForms);
    storeData(filteredPinnedForms, "pinnedForms");
  };

  return (
    <View>
      <View key="pinnedForms" style={layout.screenRow}>
        <Text style={styles.header}>{I18n.t("formsGallery.pinnedForms")}</Text>
        <ScrollView horizontal>
          {pinnedForms?.map((form) => (
            <Card
              key={form.objectId ?? form.tag}
              style={layout.cardSmallStyle}
              onPress={() => {
                if (!form.tag) return navigateToCustomForm(form);
                return navigateToNewRecord(form.tag);
              }}
              onLongPress={() => removePinnedForm(form)}
            >
              <View style={styles.cardContainer}>
                {form.image !== undefined && (
                  <form.image height={40} style={styles.svg} />
                )}
                <View style={styles.textContainer}>
                  <Text style={styles.text}>
                    {form.customForm === false ? I18n.t(form.name) : form.name}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
          {pinnedForms?.length < 1 && (
            <View style={layout.screenRow}>
              <Card>
                <Card.Title title={I18n.t("formsGallery.noPinnedForms")} />
              </Card>
            </View>
          )}
        </ScrollView>
      </View>
      <View key="puenteForms" style={layout.screenRow}>
        <Text style={styles.header}>{I18n.t("formsGallery.puenteForms")}</Text>
        <SmallCardsCarousel
          puenteForms={puenteForms}
          navigateToNewRecord={navigateToNewRecord}
          pinForm={pinForm}
          setUser={false}
        />
      </View>
      {/* ALL custom forms */}
      <View key="customForms" style={{ marginHorizontal: 20 }}>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.header}>
            {I18n.t("formsGallery.customForms")}
          </Text>
          <IconButton
            style={{ bottom: 7 }}
            color={theme.colors.primary}
            size={20}
            icon="refresh"
            onPress={refreshCustomForms}
          />
        </View>
      </View>
      {customForms && (
        <FormsHorizontalView
          forms={customForms}
          navigateToCustomForm={navigateToCustomForm}
          pinForm={pinForm}
        />
      )}
      {/* Workflows */}
      <View key="workflows" style={{ marginHorizontal: 20 }}>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.header}>{I18n.t("formsGallery.workflows")}</Text>
          <IconButton
            style={{ bottom: 7 }}
            color={theme.colors.primary}
            size={20}
            icon="refresh"
            onPress={refreshCustomForms}
          />
        </View>
      </View>
      {/* custom forms with workflows */}
      {Object.keys(workflowData).length > 0 &&
        Object.keys(workflowData).map((key) => (
          <FormsHorizontalView
            key={key}
            forms={workflowData[key]}
            header={key}
            navigateToCustomForm={navigateToCustomForm}
            pinForm={pinForm}
          />
        ))}
      {/* custom forms with no workflow assigned */}
      {noWorkflowData && noWorkflowData.length > 0 && (
        <FormsHorizontalView
          forms={noWorkflowData}
          header={I18n.t("formsGallery.noWorflowAssigned")}
          navigateToCustomForm={navigateToCustomForm}
          pinForm={pinForm}
        />
      )}
      {/** One day we'll have marketplace forms */}
      {/* <View style={layout.screenRow}>
        <Text style={styles.header}>{I18n.t("formsGallery.marketPlace")}</Text>
      </View>
      <View key="marketplace" style={layout.screenRow}>
        <Card>
          <Card.Content>
            <ComingSoonSVG width={200} height={200} />
            <Title>{I18n.t("formsGallery.ourMarketPlace")}</Title>
            <Paragraph>{I18n.t("formsGallery.discoverForms")}</Paragraph>
            <Button>
              <Text>{I18n.t("formsGallery.exploreForms")}</Text>
            </Button>
          </Card.Content>
        </Card>
      </View> */}
    </View>
  );
}
export default FormGallery;
