# Diseño on-chain propuesto para CLPNY (Chilean Penny)

Este documento describe las mejoras y módulos on-chain recomendados para cumplir requisitos regulatorios y operativos (bancos, SII) y servir como guía de implementación.

1) Objetivos
- Proveer control de acceso y gobernanza robusta.
- Permitire la trazabilidad y auditoría (snapshots, eventos, attestations on-chain).
- Facilitar integraciones con custodios y off-ramps mediante roles y límites.
- Mantener la privacidad (no almacenar PII on-chain).

2) Roles y gobernanza
- Roles principales (OpenZeppelin AccessControl):
  - DEFAULT_ADMIN_ROLE: puede asignar admin general.
  - GOVERNANCE_ROLE: cambios de parámetros, publicación de merkle roots, gestionar custodios.
  - MINTER_ROLE: autorizado a crear tokens (usualmente custodios multisig).
  - BURNER_ROLE: autorizado a quemar (redenciones).
  - PAUSER_ROLE: pausar el contrato en emergencias.
  - KYC_ADMIN_ROLE: administrar whitelist (onboarding KYC).
  - AUDITOR_ROLE: generar snapshots y emitir attestations.

- Recomendación: delegar la administración de roles sensibles a un multisig (Gnosis Safe) con timelock.

3) Permissioning y políticas
- Modelo recomendado: permissioned con whitelist (fase inicial institucional). Transferencias y mint/burn requieren que las contrapartes estén en la whitelist.
- Mantener maps de "frozen" para cuentas sujetas a bloqueo judicial/regulatorio.
- Establecer límites diarios/globales por dirección y por rol (parámetros on-chain modificables por GOVERNANCE_ROLE).

4) Mógdulos/estándares a integrar
- OpenZeppelin AccessControl (ya integrado)
- Pausable (ya integrado)
- SafeERC20 (ya integrado)
- ERC20Snapshot: para snapshots periódicos (auditoría y reporting). Registrar snapshot_id y publicar report_hash off-chain y su tx on-chain para prueba.
- ERC20Permit (EIP-2612): habilitar approvals gasless (útil para UX con bancos y custodios).
- ERC4626 (opcional): tokenized vault para manejar reservas colaterales y emitir pruebas de solvencia.
- Upgradeability (opcional): usar proxy con timelock y multisig; documentar migración y restricciones para auditoría.

5) Attestations on-chain
- Flujo: microservicio KYC genera Merkle root con wallets aprobadas; GOVERNANCE (o KYC_ADMIN firmado por multisig) publica root on-chain en un contrato de attestations.
- Registrar tx/hash del root en los reportes entregados a SII.

6) Eventos y reporting
- Emitir eventos enriquecidos (Mint/Burn/Transfer) con metadatos KYC-ref (hash) y referencia a attestation merkle root si aplica.
- Mantener exportadores que consuman eventos y generen CSV conformes a la especificación del SII.

7) Seguridad y prácticas operativas
- Multisig para mints/redemptions de grandes montos.
- Tests unitarios, integración en testnets y auditoría externa obligatoria.
- Procedimientos operativos: freeze/unfreeze, appeals, disclosure a autoridades.

8) Upgrade path
- Si se requiere upgradeability, usar proxy transparente o UUPS con governance multistep (timelock + multisig + auditor review).
- Mantener changelog on-chain: publicar hash de artefactos compilados antes de upgrade.

9) Integración con off-chain
- Contrato on-chain provee mínimos: whitelist checks, snapshot hooks, publishing merkle root txs.
- Off-chain service: KYC DB, Merkle tree generation, signer service y endpoint para que GOVERNANCE firme y publique root.

10) Lista de tareas técnicas
- Implementar ERC20Permit y ERC20Snapshot (o confirmar soporte de versión instalada de OZ y ajustar imports).
- Añadir límites y parámetros administrables por GOVERNANCE_ROLE.
- Implementar contrato de attestations (simple registry de merkle roots con timestamp y who publicó).
- Crear tests y scripts de migración / deploy para multisig/timelock.


---

Fecha: 2025-11-11


## 11. Capa tributaria explícita (SII)

El diseño debe incluir elementos específicos para facilitar el reporting tributario requerido por el Servicio de Impuestos Internos (SII), asegurando compatibilidad con las normativas actuales y futuras.

### a) Tipos de operación fiscales en eventos

Se recomienda agregar un campo `operationType` codificado en los eventos (`Transfer`, `Mint`, `Burn`):

- `0 = PAYMENT` (pago de bienes/servicios)
- `1 = INCOME` (recepción como renta/sueldo/fee)
- `2 = FX_SWAP` (compra/venta contra otra divisa)
- `3 = REDEMPTION` (canje contra pesos/depósito banco)
- `4 = INTERNAL_MOVE` (movimiento intra-custodio, no tributario)

Este campo será definido por el custodio o PSP que dispare la operación, permitiendo:

- Generar exportaciones de eventos directamente en formatos compatibles con el SII (CSV/JSON).
- Mapear operaciones a códigos de formulario o categorías tributarias off-chain.

### b) Etiquetas de período tributario

Incluir un campo opcional `taxPeriodId` en los eventos, que permita agrupar movimientos dentro de un período tributario específico (ejemplo: `"2025-Renta"`, `"2025-F29-Mes05"`). Esto facilita el cumplimiento de obligaciones fiscales.

### c) Vínculo dirección ↔ contribuyente (off-chain)

Cada dirección whitelisteada tendrá un `kycRefHash` inmutable. El mapeo `kycRefHash → RUT` se mantendrá off-chain y será accesible a las autoridades mediante convenios con custodios o emisores. Esto asegura compatibilidad con fiscalización sin comprometer la privacidad on-chain.

---

## 12. Modelo de reservas y solvencia

Para garantizar confianza y estabilidad, se propone un modelo de respaldo transparente y automatizable.

### a) Definición del modelo de respaldo

- 1 CLPNY = 1 CLP en cuentas de reserva en bancos específicos.
- Alternativamente, 1 CLPNY respaldado por una canasta de activos (CLP, bonos BCCh, UF, etc.).

Se recomienda implementar un `ReserveVault` basado en **ERC-4626** como componente obligatorio, donde solo el emisor pueda gestionar el colateral. Además, emitir eventos `ReserveUpdated(reserveType, amount, proofHash)` para vincular pruebas off-chain (auditorías, Merkle proofs, etc.).

### b) Circuit breaker de solvencia

Integrar un mecanismo que detenga automáticamente `mint` y `redeem` si un oráculo off-chain indica que el ratio reservas/CLPNY cae por debajo de un umbral configurable. Los parámetros serán ajustables por `GOVERNANCE_ROLE` con timelock.

---

## 13. AML / CFT y Travel Rule readiness

Para cumplir con normativas internacionales (FATF, Travel Rule):

### a) Travel Rule ID en eventos

Incluir un campo opcional `travelRuleRef` en los eventos (`Transfer`), que apunte a un payload off-chain con información de originator/beneficiary necesaria para cumplimiento normativo.

### b) Roles para VASP/PSP

Añadir un `VASP_ROLE` para smart contracts o cuentas que puedan marcar transacciones como "reportables AML". Definir límites por rol (montos máximos por transacción y por día) diferenciados entre wallets retail e institucionales.

### c) Niveles de KYC

Ampliar la whitelist binaria a un sistema de niveles (`kycTier[address]`):

- **KYC level 1**: Límites pequeños, solo pagos P2P.
- **KYC level 2**: Operaciones con bancos/off-ramps.
- **KYC level 3**: Empresas/grandes montos, reportes automáticos.

---

## 14. UX / Usabilidad bancaria

Para mejorar la experiencia de usuario y facilitar la adopción:

### a) Gas abstraction

Diseñar soporte para meta-transacciones (EIP-2771 o ERC-4337), permitiendo que PSPs o bancos paguen el gas en nombre de los usuarios.

### b) Alias y referencias de pago

Estandarizar un campo `paymentReference` en transferencias, permitiendo alias off-chain (ejemplo: `rut@clpny`, `empresa#factura1234`).

### c) Pagos masivos

Implementar un `batchTransfer` optimizado para nóminas, bonos y subsidios, con eventos especializados (`PayrollTransfer(payrollId, totalAmount, count)`).

---

## 15. Gobernanza más detallada

### a) Módulo de gobernanza explícito

Definir si se usará un sistema de gobernanza on-chain (ejemplo: OpenZeppelin Governor) o si inicialmente será off-chain ejecutado por multisig. Especificar qué cambios requieren:

- Timelock largo + auditoría externa (upgrades, cambios críticos).
- Timelock corto (ajustes operativos).
- Emergency-council para `pause()`.

### b) Política de upgrade

Establecer una lista de invariantes (ejemplo: decimales, semántica de `totalSupply`) y una política de migración en caso de una versión futura de CLPNY.

---

## 16. Multichain y compatibilidad con una futura MDBC

### a) Cadena canónica

Definir un `canonicalChainId` y una política de bridges oficiales (`BridgeMinter`, `BridgeBurner`) para controlar emisión/quemado cross-chain.

### b) Compatibilidad con infraestructura BCCh

Diseñar la arquitectura para integrarse con una futura MDBC o infraestructura regulada del BCCh mediante módulos de custodia institucional y bridges regulados.

---

## 17. Operativa “vida real”

### a) Recuperación de claves

Documentar opciones como cuentas custodiadas por bancos o recuperación social bajo guardianes autorizados.

### b) Disputas y chargebacks

Definir eventos `DisputeRaised(caseIdHash, who, amount)` y `DisputeResolved(caseIdHash, resolution)` gestionados por `AUDITOR_ROLE` o `COURT_AGENT_ROLE`.

### c) Órdenes judiciales

Formalizar el flujo para `freeze` con `caseIdHash`, especificando quién puede ejecutarlo y qué eventos se emiten para auditoría.

---

## 18. Observabilidad y auditoría avanzada

### a) Esquema de eventos estándar

Proponer un esquema de eventos como:

```solidity
event TransferExtended(
  address indexed from,
  address indexed to,
  uint256 value,
  bytes32 kycRefHashFrom,
  bytes32 kycRefHashTo,
  uint8 operationType,
  string taxPeriodId,
  bytes32 travelRuleRef,
  uint256 snapshotIdOpt
);
```

### b) Endpoints públicos

Diseñar APIs y un “CLPNY Explorer” para que autoridades puedan reconstruir balances y flujos a partir de snapshots.

---

Resumen: estas capas no son necesariamente todas on-chain; muchas son convenciones y hooks que la plataforma debe soportar (event hooks, campos opcionales, remisiones a pruebas off-chain). Incluirlas en el diseño demuestra una intención de cumplir con BCCh / SII / bancos y facilita conversaciones regulatorias.
Fecha: 2025-11-11
