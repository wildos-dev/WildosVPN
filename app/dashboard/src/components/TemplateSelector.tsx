import {
  Box,
  VStack,
  HStack,
  Text,
  Grid,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useColorModeValue,
  Divider
} from "@chakra-ui/react";
import { FC, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  InboundTemplate,
  TemplateCategory,
  ComplexityLevel
} from "../types/InboundTypes";
import { CategorySelector } from "./CategorySelector";
import { TemplateCard } from "./TemplateCard";

interface TemplateSelectorProps {
  templates: InboundTemplate[];
  categories: TemplateCategory[];
  selectedTemplate?: InboundTemplate;
  onTemplateSelect: (template: InboundTemplate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TemplateSelector: FC<TemplateSelectorProps> = ({
  templates,
  categories,
  selectedTemplate,
  onTemplateSelect,
  onCancel,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Состояние фильтров
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || "");
  const [complexityFilter, setComplexityFilter] = useState<ComplexityLevel | undefined>();

  // Фильтрация шаблонов
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Фильтр по категории
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        // Новая логика: фильтрация по category поля шаблона и протоколам
        filtered = filtered.filter(template => 
          template.category === selectedCategory || 
          category.protocols.includes(template.protocol as any)
        );
      }
    }

    // Фильтр по сложности
    if (complexityFilter) {
      filtered = filtered.filter(template => template.complexity === complexityFilter);
    }

    return filtered;
  }, [templates, selectedCategory, complexityFilter, categories]);

  // Обработчики
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleComplexityFilterChange = useCallback((complexity: ComplexityLevel | undefined) => {
    setComplexityFilter(complexity);
  }, []);

  const handleTemplateClick = useCallback((template: InboundTemplate) => {
    onTemplateSelect(template);
  }, [onTemplateSelect]);

  // Отображение загрузки
  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>{t('Loading templates...')}</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
      p={6}
    >
      <VStack spacing={6} align="stretch">
        {/* Заголовок */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="semibold">
              {t('Select Template')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('Choose a pre-configured inbound template')}
            </Text>
          </VStack>

          <Button size="sm" onClick={onCancel}>
            {t('Cancel')}
          </Button>
        </HStack>

        <Divider />

        {/* Селектор категорий */}
        <CategorySelector
          categories={categories}
          templates={templates}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          complexityFilter={complexityFilter}
          onComplexityFilterChange={handleComplexityFilterChange}
        />

        <Divider />

        {/* Сетка шаблонов */}
        {filteredTemplates.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">{t('No templates found')}</Text>
              <Text fontSize="sm">
                {complexityFilter 
                  ? t('Try changing the complexity filter or select a different category.')
                  : t('No templates are available for the selected category.')
                }
              </Text>
            </Box>
          </Alert>
        ) : (
          <>
            {/* Статистика */}
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600">
                {t('Showing {{count}} templates', { count: filteredTemplates.length })}
              </Text>
              
              {selectedTemplate && (
                <Text fontSize="sm" color="blue.600" fontWeight="medium">
                  {t('Selected')}: {selectedTemplate.name}
                </Text>
              )}
            </HStack>

            {/* Сетка шаблонов */}
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)"
              }}
              gap={4}
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onClick={handleTemplateClick}
                  showDetails={true}
                />
              ))}
            </Grid>
          </>
        )}

        {/* Действия */}
        <HStack justify="end" spacing={3} pt={4}>
          <Button onClick={onCancel}>
            {t('Cancel')}
          </Button>
          
          <Button
            colorScheme="blue"
            isDisabled={!selectedTemplate}
            onClick={() => selectedTemplate && onTemplateSelect(selectedTemplate)}
          >
            {t('Next')}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};