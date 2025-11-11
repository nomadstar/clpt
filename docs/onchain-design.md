# Diseño on-chain propuesto para CLPT

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

4) Módulos/estándares a integrar
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

