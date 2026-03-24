import ComingSoonSVG from "@app/assets/graphics/static/Adventurer.svg";
import ModernCard from "@impacto-design-system/Cards/ModernCard";
import SmallCardsCarousel from "@impacto-design-system/Cards/SmallCardsCarousel";
import { getData, storeData } from "@modules/async-storage";
import { customFormsQuery } from "@modules/cached-resources";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {   Button,
  IconButton,
  Paragraph,
  Text,
  Title,
useTheme ,
} from "react-native-paper";

import FormsHorizontalView from "./FormsHorizontalView";
import createStyles from "./index.styles";

function FormGallery({
  navigateToNewRecord,
  navigateToCustomForm,
  puenteForms,
  pinnedForms,
  setPinnedForms,
  setLoading,
  surveyingOrganization,
}) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const styles = createStyles(theme);
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
    // Prevent duplicate pinning - Puente and custom forms are pinned differently
    // Puente forms: identified by tag (no objectId)
    // Custom forms: identified by objectId
    const isDuplicate = pinnedForms.some((pinnedForm) => {
      // Both are Puente forms - compare by tag
      if (!form.objectId && !pinnedForm.objectId) {
        return pinnedForm.tag === form.tag;
      }
      // Both are custom forms - compare by objectId
      if (form.objectId && pinnedForm.objectId) {
        return pinnedForm.objectId === form.objectId;
      }
      // Different form types are never duplicates
      return false;
    });
    if (isDuplicate) return;
    
    const newPinnedForms = [...pinnedForms, form];
    setPinnedForms(newPinnedForms);
    await storeData(newPinnedForms, "pinnedForms");
  };

  const removePinnedForm = async (form) => {
    const filteredPinnedForms = pinnedForms.filter(
      (pinnedForm) => pinnedForm !== form
    );
    setPinnedForms(filteredPinnedForms);
    await storeData(filteredPinnedForms, "pinnedForms");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View key="puenteForms" style={layout.screenRow}>
        <Text style={styles.header}>{I18n.t("formsGallery.puenteForms")}</Text>
        <SmallCardsCarousel
          puenteForms={puenteForms}
          navigateToNewRecord={navigateToNewRecord}
          pinForm={pinForm}
          setUser={false}
        />
      </View>
      <View key="pinnedForms" style={layout.screenRow}>
        <Text style={styles.header}>{I18n.t("formsGallery.pinnedForms")}</Text>
        <ScrollView horizontal>
          {pinnedForms?.map((form) => (
            <ModernCard
              key={form.objectId ?? form.tag}
              style={layout.cardSmallStyle}
              onPress={() => {
                if (!form.tag) return navigateToCustomForm(form);
                return navigateToNewRecord(form.tag);
              }}
              onLongPress={() => removePinnedForm(form)}
            >
              <View style={styles.cardContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.text}>
                    {form.customForm === false ? I18n.t(form.name) : form.name}
                  </Text>
                </View>
              </View>
            </ModernCard>
          ))}
          {pinnedForms?.length < 1 && (
            <View style={layout.screenRow}>
              <ModernCard>
                <View style={{ padding: 16 }}>
                  <Text>{I18n.t("formsGallery.noPinnedForms")}</Text>
                </View>
              </ModernCard>
            </View>
          )}
        </ScrollView>
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
