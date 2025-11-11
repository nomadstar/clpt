# ToDo: Compatibilidad con entidades chilenas (bancos, SII, reguladores)

Resumen: acciones necesarias para que la stablecoin `CLPT` cumpla con requisitos regulatorios y operativos en Chile.

- [ ] Definir requisitos regulatorios y de integración
	- Reunir requisitos KYC/AML, reporting SII, conciliación bancaria y acuerdos con custodios.
	- Contactar asesoría legal/regulatoria para validar obligaciones.

- [ ] Diseñar cambios on-chain necesarios
	- Decidir módulos a añadir: AccessControl (roles), Pausable, Blacklist/Allowlist, ERC20Snapshot, ERC4626 vault, ERC20Permit (EIP‑2612).
	- Definir políticas: permissioned vs permissionless, límites, mecanismos de freeze y multisig.

- [ ] Implementar módulo de permiso y seguridad (contrato)
	- Añadir OpenZeppelin AccessControl y Pausable en `Contracts/CLPTStablecoin.sol`.
	- Añadir roles: GOVERNANCE, MINTER, BURNER, PAUSER, KYC_ADMIN, AUDITOR.
	- Implementar whitelist/blacklist y modifiers que restrinjan mint/burn/transfer si corresponde.
	- Añadir `SafeERC20` para operaciones con custodios (LINK, stablecoins colaterales).

- [ ] Diseñar capa off-chain de cumplimiento
	- Microservicio para KYC/AML: onboarding, status, lista de sancionados, reglas AML y alertas.
	- Attestations: emitir Merkle roots o firmas cuando un usuario pasa KYC; on‑chain sólo registrar roots/txs (no PII).
	- API para órdenes de mint/redemption autenticadas por custodios/multisig.

- [ ] Integración con bancos y SII (operacional)
	- Definir APIs y formatos de exportación (CSV/ISO20022/JSON) para conciliación y reportes.
	- Diseñar flujo de on/off ramps: custodia fiat <-> mint/burn on‑chain con reconciliación y SLAs.
	- Diseñar formato de reporte fiscal (snapshots, movimientos relevantes) para SII.

- [ ] Pruebas y auditoría
	- Implementar tests unitarios: mint/burn/pausable/blacklist/permit/snapshots.
	- Desplegar en testnet y realizar auditoría interna; contratar auditoría externa antes de producción.

- [ ] Documentación para entidades chilenas
	- Especificación técnica del token y del flujo KYC/on‑off ramps.
	- Políticas KYC/AML, contratos con custodios y SLAs.
	- Manuales y formatos de entrega de reportes al SII y bancos.

Notas:
- Decisión clave: permissioned (recomendado para etapa institucional) vs permissionless. La opción permissioned facilita cumplimiento pero requiere gobernanza y procesos para gestionar appeals y bloqueos.
- Antes de desplegar en producción, coordinar con asesor legal en Chile y preparar auditoría financiera sobre reservas.

Siguiente paso propuesto: implementar la versión mínima on‑chain (AccessControl + Pausable + blacklist + snapshot) en `Contracts/CLPTStablecoin.sol` y añadir tests básicos. Indica si procedo.

