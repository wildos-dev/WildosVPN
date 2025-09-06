import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Tooltip,
  useColorModeValue,
  Icon,
  Flex,
  Circle
} from "@chakra-ui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import type { InboundTemplate } from "../types/InboundTypes";

interface TemplateCardProps {
  template: InboundTemplate;
  isSelected?: boolean;
  onClick: (template: InboundTemplate) => void;
  showDetails?: boolean;
}

export const TemplateCard: FC<TemplateCardProps> = ({
  template,
  isSelected = false,
  onClick,
  showDetails = true
}) => {
  const { t } = useTranslation();
  
  // Цветовые схемы
  const bgColor = useColorModeValue("white", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.600");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectedBorderColor = useColorModeValue("blue.300", "blue.500");
  
  // Цветовые схемы для сложности
  const complexityColors = {
    easy: { colorScheme: "green", icon: "🟢" },
    medium: { colorScheme: "yellow", icon: "🟡" },
    advanced: { colorScheme: "red", icon: "🔴" }
  };

  // Цветовые схемы для безопасности
  const securityColors = {
    none: { colorScheme: "gray", icon: "🔓" },
    tls: { colorScheme: "blue", icon: "🔐" },
    reality: { colorScheme: "purple", icon: "👻" }
  };

  // Иконки транспортов
  const transportIcons = {
    tcp: "🔗",
    ws: "🌐",
    grpc: "📡",
    http: "🌍",
    splithttp: "🔄",
    httpupgrade: "⬆️",
    kcp: "⚡",
    xhttp: "🧪"
  };

  const complexity = complexityColors[template.complexity];
  const security = securityColors[template.security];
  const transportIcon = transportIcons[template.transport];

  return (
    <Box
      as="button"
      w="full"
      p={4}
      bg={isSelected ? selectedBg : bgColor}
      border="2px"
      borderColor={isSelected ? selectedBorderColor : borderColor}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      onClick={() => onClick(template)}
      _hover={{
        bg: isSelected ? selectedBg : hoverBg,
        transform: "translateY(-2px)",
        boxShadow: "md"
      }}
      _active={{
        transform: "translateY(0)"
      }}
      position="relative"
      textAlign="left"
    >
      {/* Индикатор выбора */}
      {isSelected && (
        <Circle
          size="20px"
          bg="blue.500"
          color="white"
          position="absolute"
          top={2}
          right={2}
        >
          <Icon as={CheckIcon} w={3} h={3} />
        </Circle>
      )}

      <VStack spacing={3} align="stretch">
        {/* Заголовок с иконкой */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <HStack spacing={2}>
              <Text fontSize="lg">{template.icon}</Text>
              <Text fontWeight="semibold" fontSize="md" noOfLines={1}>
                {template.name}
              </Text>
            </HStack>
            
            {showDetails && (
              <Text fontSize="sm" color="gray.500" noOfLines={2}>
                {template.description}
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Технические детали */}
        <HStack spacing={2} flexWrap="wrap">
          {/* Протокол */}
          <Badge colorScheme="blue" variant="subtle">
            {template.protocol.toUpperCase()}
          </Badge>

          {/* Транспорт */}
          <Tooltip label={`Transport: ${template.transport}`}>
            <Badge colorScheme="gray" variant="outline">
              {transportIcon} {template.transport.toUpperCase()}
            </Badge>
          </Tooltip>

          {/* Безопасность */}
          <Tooltip label={`Security: ${template.security}`}>
            <Badge colorScheme={security.colorScheme} variant="subtle">
              {security.icon} {template.security.toUpperCase()}
            </Badge>
          </Tooltip>
        </HStack>

        {showDetails && (
          <>
            {/* Возможности */}
            <HStack spacing={2} flexWrap="wrap">
              {template.cdnSupport && (
                <Tooltip label="Поддерживает CDN (Cloudflare, etc.)">
                  <Badge size="sm" colorScheme="green" variant="outline">
                    📡 CDN
                  </Badge>
                </Tooltip>
              )}
              
              {template.multiplexing && (
                <Tooltip label="Встроенное мультиплексирование">
                  <Badge size="sm" colorScheme="purple" variant="outline">
                    🔀 Mux
                  </Badge>
                </Tooltip>
              )}
              
              {template.defaultPort && (
                <Tooltip label={`Рекомендуемый порт: ${template.defaultPort}`}>
                  <Badge size="sm" colorScheme="gray" variant="outline">
                    🔌 {template.defaultPort}
                  </Badge>
                </Tooltip>
              )}

              {/* Специальные поля и возможности */}
              {template.tags?.includes('fallback') && (
                <Tooltip label="Поддержка множественных протоколов">
                  <Badge size="sm" colorScheme="orange" variant="outline">
                    🔀 Fallback
                  </Badge>
                </Tooltip>
              )}

              {template.tags?.includes('h3') && (
                <Tooltip label="Поддержка HTTP/3">
                  <Badge size="sm" colorScheme="blue" variant="outline">
                    🚀 H3
                  </Badge>
                </Tooltip>
              )}

              {template.tags?.includes('fragment') && (
                <Tooltip label="Фрагментация пакетов">
                  <Badge size="sm" colorScheme="cyan" variant="outline">
                    🧩 Fragment
                  </Badge>
                </Tooltip>
              )}

              {template.tags?.includes('noise') && (
                <Tooltip label="Шумовая обфускация">
                  <Badge size="sm" colorScheme="teal" variant="outline">
                    🌊 Noise
                  </Badge>
                </Tooltip>
              )}
            </HStack>

            {/* Нижняя панель */}
            <Flex justify="space-between" align="center">
              {/* Сложность с улучшенным отображением */}
              <Tooltip 
                label={
                  template.complexity === 'easy' ? 'Легко настроить, подходит для начинающих' :
                  template.complexity === 'medium' ? 'Требует базовых знаний сетей' :
                  'Для опытных пользователей, сложные настройки'
                }
              >
                <HStack spacing={1} cursor="help">
                  <Text fontSize="xs">{complexity.icon}</Text>
                  <Badge 
                    size="xs" 
                    colorScheme={complexity.colorScheme} 
                    variant="subtle"
                  >
                    {t(template.complexity)}
                  </Badge>
                </HStack>
              </Tooltip>

              {/* Категория с улучшенным отображением */}
              <Tooltip label={`Категория: ${template.category}`}>
                <Text 
                  fontSize="xs" 
                  color="gray.500" 
                  textTransform="uppercase" 
                  fontWeight="medium"
                  cursor="help"
                >
                  {template.category}
                </Text>
              </Tooltip>
            </Flex>
          </>
        )}

        {/* Предупреждения об ограничениях */}
        {template.restrictions && template.restrictions.length > 0 && (
          <Box
            p={2}
            bg={useColorModeValue("yellow.50", "yellow.900")}
            borderRadius="md"
            border="1px"
            borderColor={useColorModeValue("yellow.200", "yellow.700")}
          >
            <Text fontSize="xs" color="yellow.700">
              ⚠️ {template.restrictions[0]}
              {template.restrictions.length > 1 && ` (+${template.restrictions.length - 1})`}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};