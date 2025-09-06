import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Flex,
  useColorModeValue,
  ButtonGroup,
  Select,
  FormControl,
  FormLabel
} from "@chakra-ui/react";
import { FC, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  TemplateCategory,
  InboundTemplate,
  ComplexityLevel,
  ProtocolType
} from "../types/InboundTypes";

interface CategorySelectorProps {
  categories: TemplateCategory[];
  templates: InboundTemplate[];
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;
  complexityFilter?: ComplexityLevel;
  onComplexityFilterChange?: (complexity: ComplexityLevel | undefined) => void;
}

export const CategorySelector: FC<CategorySelectorProps> = ({
  categories,
  templates,
  selectedCategory,
  onCategoryChange,
  complexityFilter,
  onComplexityFilterChange
}) => {
  const { t } = useTranslation();
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const selectedColor = useColorModeValue("blue.600", "blue.200");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Подсчет шаблонов по категориям с учетом фильтра сложности
  const categoryStats = useMemo(() => {
    return categories.map(category => {
      const categoryTemplates = templates.filter(template => 
        template.category === category.id || 
        category.protocols.includes(template.protocol)
      );
      
      const filteredCount = complexityFilter 
        ? categoryTemplates.filter(t => t.complexity === complexityFilter).length
        : categoryTemplates.length;

      return {
        ...category,
        count: filteredCount,
        totalCount: categoryTemplates.length
      };
    });
  }, [categories, templates, complexityFilter]);

  // Варианты сложности для фильтра
  const complexityOptions: Array<{value: ComplexityLevel | '', label: string}> = [
    { value: '', label: t('All levels') },
    { value: 'easy', label: t('Easy') },
    { value: 'medium', label: t('Medium') },
    { value: 'advanced', label: t('Advanced') }
  ];

  return (
    <VStack spacing={4} align="stretch">
      {/* Фильтр по сложности */}
      {onComplexityFilterChange && (
        <FormControl maxW="200px">
          <FormLabel fontSize="sm">{t('Complexity Filter')}</FormLabel>
          <Select
            size="sm"
            value={complexityFilter || ''}
            onChange={(e) => onComplexityFilterChange(
              e.target.value ? e.target.value as ComplexityLevel : undefined
            )}
          >
            {complexityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Вкладки категорий */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.600">
          {t('Protocol Categories')}
        </Text>
        
        <ButtonGroup variant="outline" spacing={2} flexWrap="wrap" isAttached={false}>
          {categoryStats.map((category) => {
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                size="md"
                onClick={() => onCategoryChange(category.id)}
                bg={isSelected ? selectedBg : "transparent"}
                color={isSelected ? selectedColor : undefined}
                borderColor={isSelected ? selectedColor : borderColor}
                borderWidth="1px"
                _hover={{
                  bg: isSelected ? selectedBg : useColorModeValue("gray.50", "gray.700")
                }}
                minW="120px"
                h="auto"
                py={3}
                px={4}
              >
                <VStack spacing={1}>
                  <HStack spacing={2}>
                    <Text>{category.icon}</Text>
                    <Text fontWeight="medium">{category.name}</Text>
                  </HStack>
                  
                  <HStack spacing={1}>
                    <Badge
                      size="sm"
                      colorScheme={category.count > 0 ? "blue" : "gray"}
                      variant={isSelected ? "solid" : "subtle"}
                    >
                      {category.count}
                    </Badge>
                    {complexityFilter && category.totalCount !== category.count && (
                      <Text fontSize="xs" color="gray.500">
                        / {category.totalCount}
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </Button>
            );
          })}
        </ButtonGroup>
      </Box>

      {/* Описание выбранной категории */}
      {selectedCategory && (
        <Box
          p={3}
          bg={useColorModeValue("gray.50", "gray.700")}
          borderRadius="md"
          border="1px"
          borderColor={borderColor}
        >
          {(() => {
            const category = categoryStats.find(c => c.id === selectedCategory);
            if (!category) return null;

            return (
              <VStack align="start" spacing={2}>
                <HStack>
                  <Text>{category.icon}</Text>
                  <Text fontWeight="medium">{category.name}</Text>
                  <Badge colorScheme="blue">{category.count}</Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {category.description}
                </Text>
                {category.count === 0 && (
                  <Text fontSize="xs" color="orange.500">
                    {complexityFilter 
                      ? t('No templates match the current complexity filter')
                      : t('No templates available in this category')
                    }
                  </Text>
                )}
              </VStack>
            );
          })()}
        </Box>
      )}

      {/* Статистика */}
      <Flex justify="space-between" align="center" fontSize="xs" color="gray.500">
        <Text>
          {t('Total categories')}: {categories.length}
        </Text>
        <Text>
          {t('Available templates')}: {categoryStats.reduce((sum, cat) => sum + cat.count, 0)}
        </Text>
      </Flex>
    </VStack>
  );
};